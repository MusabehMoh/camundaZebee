import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StartProcessForm from './components/StartProcessForm';
import TaskList from './components/TaskList';
import './App.css';

function App() {
  const [view, setView] = useState('home');
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Leave Approval System</h1>
        <nav>
          <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>
            Home
          </button>
          <button onClick={() => setView('start')} className={view === 'start' ? 'active' : ''}>
            Request Leave
          </button>
          <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'active' : ''}>
            Pending Tasks
          </button>
        </nav>
      </header>
      
      <main>
        {view === 'home' && (
          <div className="home-container">
            <h2>Welcome to Leave Approval System</h2>
            <p>This is a simple demo of Camunda 8 with a Leave Approval workflow.</p>
            <p>Use the navigation buttons to request leave or view pending tasks for approval.</p>
          </div>
        )}
        
        {view === 'start' && <StartProcessForm />}
        {view === 'tasks' && <TaskList />}
      </main>
    </div>
  );
}

export default App;