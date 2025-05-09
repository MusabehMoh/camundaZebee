import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StartProcessForm from './components/StartProcessForm';
import TaskList from './components/TaskList';
import RBACManagement from './components/RBACManagement';
import Login from './components/Login';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const [view, setView] = useState('home');
  const { currentUser, userRole, logout, hasPermission } = useAuth();
  
  // Redirect to login if trying to access protected pages without being logged in
  useEffect(() => {
    if (!currentUser && (view !== 'home' && view !== 'login')) {
      setView('login');
    }
  }, [currentUser, view]);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Leave Approval System</h1>
        {currentUser ? (
          <>
            <div className="user-info">
              <span>Logged in as: <strong>{currentUser.name}</strong> ({userRole})</span>
              <button onClick={logout} className="button-logout">Logout</button>
            </div>
            <nav>
              <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>
                Home
              </button>
              {hasPermission('create_request') && (
                <button onClick={() => setView('start')} className={view === 'start' ? 'active' : ''}>
                  Request Leave
                </button>
              )}
              {(hasPermission('update_task') || hasPermission('read_all')) && (
                <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'active' : ''}>
                  Pending Tasks
                </button>
              )}
              {hasPermission('create_all') && (
                <button onClick={() => setView('rbac')} className={view === 'rbac' ? 'active' : ''}>
                  Manage Permissions
                </button>
              )}
            </nav>
          </>
        ) : (
          <div className="login-nav">
            <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>
              Home
            </button>
            <button onClick={() => setView('login')} className={view === 'login' ? 'active' : ''}>
              Login
            </button>
          </div>
        )}
      </header>
      
      <main>
        {!currentUser && view === 'login' && <Login />}
        
        {view === 'home' && (
          <div className="home-container">
            <h2>Welcome to Leave Approval System</h2>
            <p>This is a simple demo of Camunda 8 with a Leave Approval workflow.</p>
            <p>Use the navigation buttons to request leave or view pending tasks for approval.</p>
            {!currentUser && (
              <div className="login-prompt">
                <p>Please <button onClick={() => setView('login')} className="link-button">login</button> to access the system.</p>
              </div>
            )}
          </div>
        )}
        
        {currentUser && view === 'start' && <StartProcessForm />}
        {currentUser && view === 'tasks' && <TaskList />}
        {currentUser && view === 'rbac' && hasPermission('create_all') && <RBACManagement />}
      </main>
    </div>
  );
}

export default App;