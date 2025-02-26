package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

var (
	document   string
	mu         sync.Mutex
	uploadChan = make(chan string, 10) // Queue for file uploads
	cache      *LRUCache
)

func main() {
	cache = NewLRUCache(100)

	go processUploads()

	r := mux.NewRouter()
	r.HandleFunc("/upload", uploadHandler).Methods("POST")
	r.HandleFunc("/query", queryHandler).Methods("GET")

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3000"}),
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)

	log.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", corsHandler(r)))
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error reading file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read the entire file content
	var buf bytes.Buffer
	_, err = buf.ReadFrom(file)
	if err != nil {
		http.Error(w, "Error reading file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Convert the buffer to a string
	text := buf.String()

	uploadChan <- text
	fmt.Fprintf(w, "File queued for processing")
}

func processUploads() {
	for text := range uploadChan {
		mu.Lock()
		document = text
		cache.Clear()
		mu.Unlock()
		time.Sleep(500 * time.Millisecond)
		log.Println("Processed new document")
	}
}

func queryHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}

	if cached, ok := cache.Get(query); ok {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		flusher, _ := w.(http.Flusher)
		for _, word := range strings.Split(cached, " ") {
			fmt.Fprintf(w, "data: %s \n\n", word)
			flusher.Flush()
			time.Sleep(50 * time.Millisecond)
		}
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	mu.Lock()
	doc := document
	mu.Unlock()

	if doc == "" {
		fmt.Fprintf(w, "data: No document uploaded yet\n\n")
		w.(http.Flusher).Flush()
		return
	}

	// Call Python RAG service
	response, err := callRAGService(doc, query)
	if err != nil {
		http.Error(w, "Error processing query: "+err.Error(), http.StatusInternalServerError)
		return
	}

	cache.Add(query, response)
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}
	for _, word := range strings.Split(response, " ") {
		fmt.Fprintf(w, "data: %s \n\n", word)
		flusher.Flush()
		time.Sleep(100 * time.Millisecond)
	}
}

func callRAGService(doc, query string) (string, error) {
	payload := map[string]string{"document": doc, "query": query}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	resp, err := http.Post("http://localhost:5000/rag", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("RAG service returned status: %d", resp.StatusCode)
	}

	var result struct {
		Response string `json:"response"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Response, nil
}
