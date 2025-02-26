import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import FileUpload from './components/FileUpload';
import History from './components/History';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('queryHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [streamingResponse, setStreamingResponse] = useState('');

  useEffect(() => {
    localStorage.setItem('queryHistory', JSON.stringify(history));
  }, [history]);

  const handleQuery = (queryText) => {
    if (!queryText.trim()) return;

    const newMessage = { text: queryText, sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);
    setHistory((prev) => [...prev, queryText]);

    const eventSource = new EventSource(`http://localhost:8080/query?q=${encodeURIComponent(queryText)}`);
    let response = '';

    eventSource.onmessage = (event) => {
      response += event.data + ' ';
      setStreamingResponse(response);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setMessages((prev) => [...prev, { text: response.trim(), sender: 'bot' }]);
      setStreamingResponse('');
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <History history={history} handleQuery={handleQuery} />
      <div className="flex-1 p-6 fixed left-[16rem] w-[calc(100%-16rem)]">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">RAG Chat</h1>
        <FileUpload />
        <Chat
          messages={messages}
          setMessages={setMessages}
          setHistory={setHistory}
          streamingResponse={streamingResponse}
          handleQuery={handleQuery}
        />
      </div>
    </div>
  );
}

export default App;