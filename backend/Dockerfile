FROM golang:1.21-alpine

WORKDIR /app
COPY . .
RUN go mod init rag-backend
RUN go get github.com/gorilla/mux
RUN go get github.com/gorilla/handlers
RUN go build -o rag-backend main.go cache.go

EXPOSE 8080
CMD ["./rag-backend"]