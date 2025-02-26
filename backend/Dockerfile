FROM golang:1.21-alpine

WORKDIR /app
COPY . .
RUN go mod init backend
RUN go mod tidy
RUN go get github.com/gorilla/mux
RUN go get github.com/gorilla/handlers
RUN go build backend

EXPOSE 8080
CMD ["./backend"]