import React from 'react';

function History({ history, handleQuery }) {
  const handleHistoryClick = (query) => {
    handleQuery(query); // Trigger the query again
  };

  return (
    <div className="w-64 bg-gray-200 p-4 shadow-md">
      <h2 className="text-lg font-semibold mb-4">Query History</h2>
      {history.length === 0 ? (
        <p className="text-gray-500">No queries yet.</p>
      ) : (
        <ul>
          {history.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleHistoryClick(item)}
              className="mb-2 p-2 bg-white rounded cursor-pointer hover:bg-gray-100"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;