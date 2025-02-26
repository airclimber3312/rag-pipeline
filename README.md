RAG Pipeline Documentation
==========================

This document outlines the setup, architecture, and usage of a Retrieval-Augmented Generation (RAG) pipeline built to demonstrate full-stack development and machine learning integration. The pipeline allows users to upload a text document and query it via a chat interface, retrieving relevant context and generating responses using a free, open-source language model.

1\. Instructions to Set Up and Run the Project
----------------------------------------------

### Prerequisites

*   **Go**: Version 1.21+ (download from [golang.org](https://golang.org/dl/)).
    

*   **Python**: Version 3.9+ (download from [python.org](https://www.python.org/downloads/)).
    

*   **Node.js**: Version 18+ with npm (download from [nodejs.org](https://nodejs.org/)).
    

*   **Docker**: Optional, for containerized deployment (download from [docker.com](https://www.docker.com/get-started)).
    

*   **Git**: For version control (optional).
    

**Project Structure**
```
rag-pipeline/
├── backend/           # Go backend
│   ├── main.go
│   ├── cache.go
│   └── Dockerfile
├── rag-service/       # Python RAG microservice
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/      # React frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
└── README.md          # This file
```

### Setup and Running Locally

#### Step 1: Clone or Create the Project

*   If using Git: git clone .
    
*   Otherwise, manually create the directory structure and copy the files from the provided code snippets.
    

#### Step 2: Set Up the Python RAG Service

1.  **Navigate to rag-service**: rag-pipeline/rag-service
    
2.  **Install Dependencies**:
    
    *   Create and activate a virtual environment (optional but recommended): ```python -m venv venv.\\venv\\Scripts\\activate```
        
    *   Install requirements: ```pip install -r requirements.```
        
    *   This installs flask, sentence-transformers, transformers, and torch for the free models (all-MiniLM-L6-v2 and gpt2).
        
3.  **Run the Service**: ```python main.py```
    
    *   Runs on http://localhost:5000. Keep this terminal open.
        

#### Step 3: Set Up the Go Backend

1.  **Navigate to backend**: ```cd rag-pipeline/backend``` 
    
2.  **Initialize Go Module**: ```go mod init rag-backend```
    
3.  **Install Dependencies**: ```go get github.com/gorilla/muxgo get github.com/gorilla/handlers```
    
4.  **Run the Backend**: ```go run main.go cache.go```
    
    *   Runs on http://localhost:8080. Open a new terminal for this.
        

#### Step 4: Set Up the React Frontend

1.  **Navigate to frontend**: ```cd rag-pipeline/frontend```
    
2.  **Install Dependencies**: 

```bash
npm install
npm install -D tailwindcss
npx tailwindcss init
```        
    
3.  **Run the Frontend**:
    
```bash
npm start
```

*  Opens at http://localhost:3000 in your browser. Open a third terminal.
    

#### Step 5: Test the Pipeline

*   Open http://localhost:3000.
    
*   Upload a .txt file (e.g., sample.txt below).
    
*   Enter a query in the chat (e.g., "How tall is the Eiffel Tower?").
    

### Docker Setup (Optional)

1.  **Build and Run Go Backend**:
    ```bash
    cd backenddocker build -t rag-backend .
    docker run -p 8080:8080 rag-backend
    ``` 
    
2.  **Build and Run Python RAG Service**:
    ```bash
    cd ../rag-servicedocker build -t rag-service .
    docker run -p 5000:5000 rag-service
    ```
    
3.  **Build and Run Frontend**:
    ```bash
    cd ../rag-frontenddocker build -t frontend .
    docker run -p 3000:3000 rag-frontend
    ```
    
4.  **Docker Compose** 
    ```bash
    docker-compose up
    ```
        

2\. Architecture and Design Decisions
-------------------------------------

### Architecture Overview

*   **Frontend (React)**:
    
    *   Built with React for a single-page app.
        
    *   Components: FileUpload for uploading documents, Chat for querying, History for past queries.
        
    *   Uses Server-Sent Events (SSE) for streaming responses from the backend.
        
    *   Styled with TailwindCSS for a modern, responsive UI.
        

*   **Backend (Go)**:
    
    *   Written in Go for performance and concurrency.
        
    *   Handles HTTP requests (/upload, /query) with gorilla/mux.
        
    *   Features:
        
        *   **Caching**: LRU cache for repeated queries.
            
        *   **Queue**: Channel-based queue for file uploads.
            
        *   **CORS**: Enabled with gorilla/handlers for frontend access.
            
    *   Delegates RAG processing to a Python microservice via REST API.
        

*   **RAG Service (Python)**:
    
    *   Implements the RAG pipeline with free, open-source models:
        
        *   **Retrieval**: all-MiniLM-L6-v2 from Sentence-Transformers for embedding-based context retrieval.
            
        *   **Generation**: gpt2 (124M) from Hugging Face for response generation.
            
    *   Exposes a /rag endpoint using Flask.
        
    *   Runs on localhost:5000.
        

### Design Decisions

1.  **Language Model Choice**:
    
    *   **Why GPT-2**: Free, open-source, and lightweight (124M parameters). Doesn’t require API keys, unlike paid services (e.g., OpenAI).
        
    *   **Why Sentence-Transformers**: all-MiniLM-L6-v2 is efficient (22M parameters) and provides semantic embeddings, improving retrieval over keyword matching.
        
2.  **Go + Python Split**:
    
    *   **Go**: Chosen for the backend due to the requirement, excels at concurrency (goroutines for upload queue), and integrates well with React via SSE.
        
    *   **Python**: Used for RAG because ML libraries (e.g., transformers, sentence-transformers) are Python-native, and Go lacks native support for running GPT-2 directly.
        
3.  **Microservice Architecture**:
    
    *   Separated RAG logic into a Python service to leverage mature ML ecosystems while keeping the Go backend lightweight and focused on API handling.
        
    *   Communication via REST (HTTP POST to localhost:5000/rag) for simplicity.
        
4.  **Retrieval and Generation**:
    
    *   **Retrieval**: Uses cosine similarity on embeddings for semantic relevance, a step up from keyword matching.
        
    *   **Generation**: GPT-2 generates responses based on retrieved context, fulfilling the "language model" requirement.
        
5.  **Bonus Features**:
    
    *   **Docker**: Containerized for portability.
        
    *   **Caching**: LRU cache in Go speeds up repeated queries.
        
    *   **Unit Tests**: Omitted due to time but planned (see below).
        
    *   **Frontend Enhancements**: Query history with re-triggering, result highlighting.
        

### Plans Not Implemented

*   **Unit Tests**: Intended for Go (e.g., queryHandler, cache) and Python (e.g., retrieve\_context), but skipped due to focus on ML integration.
    
*   **Advanced Retrieval**: Could use a vector DB (e.g., FAISS) for larger documents.
    
*   **Model Optimization**: GPT-2 could be quantized (e.g., with ONNX) for faster CPU inference.
    
*   **Single-Language Solution**: Explored running GPT-2 in Go via ONNX bindings but abandoned due to complexity and lack of free, mature libraries.