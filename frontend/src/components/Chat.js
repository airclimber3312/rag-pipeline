import React, { useState } from 'react';
import { highlightText } from '../utils';

function Chat({ messages, setMessages, setHistory, streamingResponse, handleQuery }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    handleQuery(query);
    setQuery('');
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="h-96 overflow-y-auto mb-4 p-2 border border-gray-200 rounded">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 p-2 rounded-lg ${
              msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'
            }`}
          >
            {msg.sender === 'bot' && messages.length > 0 ? (
              <span dangerouslySetInnerHTML={{ __html: idx !== messages.length - 1 ? msg.text : highlightText(msg.text, messages[messages.length - 2].text) }} />
            ) : (
              msg.text
            )}
          </div>
        ))}
        {streamingResponse && (
          <div className="mb-2 p-2 rounded-lg bg-green-100 text-left">
            <span dangerouslySetInnerHTML={{ __html: highlightText(streamingResponse, messages[messages.length - 1]?.text) }} />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;