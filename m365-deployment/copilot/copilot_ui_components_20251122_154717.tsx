// types.ts
export interface Message {
  id: string;
  timestamp: Date;
  sender: 'user' | 'copilot';
  text: string;
  type?: 'text' | 'link' | 'chart';
  data?: any; // Additional data for types like 'link' or 'chart'
}

export interface Suggestion {
  label: string;
  query: string;
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}
// CopilotChat.tsx
import React, { useEffect, useState } from 'react';
import CopilotMessage from './CopilotMessage';
import CopilotInput from './CopilotInput';
import CopilotSuggestions from './CopilotSuggestions';
import CopilotHistory from './CopilotHistory';
import { Message, Suggestion, Theme } from './types';
import socketIOClient from 'socket.io-client';

const CopilotChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [theme, setTheme] = useState<Theme>(Theme.Light);
  const [loading, setLoading] = useState<boolean>(false);

  const suggestions: Suggestion[] = [
    { label: 'Show my jobs for today', query: 'jobs today' },
    { label: 'Latest NCRs', query: 'latest ncr' },
    { label: 'Project status [job number]', query: 'project status' },
    { label: 'Generate weekly report', query: 'weekly report' },
  ];

  useEffect(() => {
    const socket = socketIOClient('http://localhost:4000'); // Replace with your websocket server URL
    socket.on('new message', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    return () => socket.disconnect();
  }, []);

  const sendMessage = (text: string, type: 'text' | 'voice') => {
    setLoading(true);
    fetch('/api/copilot/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
    })
      .then((response) => response.json())
      .then((data: Message) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      })
      .finally(() => setLoading(false));
  };

  const handleSuggestionClick = (query: string) => {
    sendMessage(query, 'text');
  };

  return (
    <div className={theme === Theme.Dark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}>
      <h1 className="text-2xl font-bold p-4 text-center">Copilot Chat</h1>
      <CopilotHistory messages={messages} loading={loading} />
      <CopilotSuggestions suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
      <CopilotInput onSendMessage={sendMessage} />
    </div>
  );
};

export default CopilotChat;
// CopilotMessage.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Message } from './types';

const CopilotMessage: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div
      className={`flex flex-col mb-4 ${
        message.sender === 'user' ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`p-3 rounded-lg ${
          message.sender === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-300 text-gray-800'
        } max-w-lg`}
      >
        <div>
          {message.type === 'text' ? (
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{message.text}</ReactMarkdown>
          ) : (
            <p>{message.text}</p>
          )}
          {message.type === 'chart' && message.data && (
            // Render chart/graphs here using recharts
            <div>Chart placeholder</div>
          )}
        </div>
      </div>
      <small className="text-gray-400">{message.timestamp.toLocaleTimeString()}</small>
    </div>
  );
};

export default CopilotMessage;
// CopilotInput.tsx
import React, { useState } from 'react';
import { useSpeechRecognition } from 'react-speech-recognition';

const CopilotInput: React.FC<{ onSendMessage: (text: string, type: 'text' | 'voice') => void }> = ({ onSendMessage }) => {
  const [text, setText] = useState('');

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const startListening = () => {
    if (browserSupportsSpeechRecognition) {
      resetTranscript();
      listening ? undefined : startListening();
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const handleSend = () => {
    if (text) {
      onSendMessage(text, 'text');
      setText('');
    } else if (transcript) {
      onSendMessage(transcript, 'voice');
      resetTranscript();
    }
  };

  return (
    <div className="flex p-4">
      <textarea
        value={text.length > 0 ? text : transcript}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-2 border rounded-lg mr-2 resize-none"
        rows={1}
        placeholder="Type a message..."
      />
      <button
        onClick={startListening}
        className="bg-gray-300 px-4 py-2 rounded mr-2"
      >
        {listening ? 'Listening...' : 'Voice'}
      </button>
      <button
        onClick={handleSend}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Send
      </button>
    </div>
  );
};

export default CopilotInput;
// CopilotSuggestions.tsx
import React from 'react';
import { Suggestion } from './types';

const CopilotSuggestions: React.FC<{ suggestions: Suggestion[], onSuggestionClick: (query: string) => void }> = ({ suggestions, onSuggestionClick }) => {
  return (
    <div className="flex flex-wrap p-4">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion.query)}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-2 mb-2"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
};

export default CopilotSuggestions;
// CopilotHistory.tsx
import React from 'react';
import CopilotMessage from './CopilotMessage';
import { Message } from './types';

const CopilotHistory: React.FC<{ messages: Message[]; loading: boolean }> = ({ messages, loading }) => {
  return (
    <div className="overflow-y-scroll pb-72">
      {messages.map((message) => (
        <CopilotMessage key={message.id} message={message} />
      ))}
      {loading && (
        <div className="p-3 rounded-lg bg-gray-300 text-gray-800 max-w-lg text-center">
          <p>Typing...</p>
        </div>
      )}
    </div>
  );
};

export default CopilotHistory;
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Inside CopilotMessage component, conditionally render the chart
{message.type === 'chart' && message.data && (
  <LineChart
    width={500}
    height={300}
    data={message.data}
    margin={{
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
  </LineChart>
)}