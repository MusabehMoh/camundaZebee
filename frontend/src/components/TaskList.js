import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [currentRole, setCurrentRole] = useState(''); // Empty string by default
  const [currentUser, setCurrentUser] = useState('');

  // Mock user accounts
  const mockUsers = {
    'john.manager@example.com': { name: 'John Smith', role: 'manager' },
    'jane.hr@example.com': { name: 'Jane Wilson', role: 'hr' },
    'admin@example.com': { name: 'Admin User', role: 'all' }
  };

  // Function to fetch tasks from the backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // If no role is selected, don't fetch tasks
      if (!currentRole) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      const response = await axios.get('http://localhost:3002/api/tasks');
      
      // If a specific role is selected, filter tasks
      let filteredTasks = response.data;
      if (currentRole !== 'all') {
        filteredTasks = response.data.filter(task => 
          task.role === currentRole || !task.role // Include tasks without a role for backward compatibility
        );
      }
      
      setTasks(filteredTasks);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when component mounts or role changes
  useEffect(() => {
    fetchTasks();
    
    // Setup polling to refresh tasks every 5 seconds
    const intervalId = setInterval(fetchTasks, 5000);
    
    // Clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [currentRole]); // Re-run when currentRole changes

  // Handle task approval or rejection
  const handleDecision = async (jobKey, approved, role) => {
    try {
      await axios.post('http://localhost:3002/api/complete', {
        jobKey,
        approved,
        role
      });
      
      setMessage({
        type: 'success',
        text: `Task ${approved ? 'approved' : 'rejected'} by ${role || 'reviewer'} successfully!`
      });
      
      // Remove the completed task from the list
      setTasks(tasks.filter(task => task.jobKey !== jobKey));
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error completing task:', error);
      setMessage({
        type: 'error',
        text: 'Failed to complete task. Please try again.'
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Handle user login selection
  const handleUserLogin = (email) => {
    if (email === '') {
      setCurrentRole('');
      setCurrentUser('');
    } else {
      const user = mockUsers[email];
      setCurrentRole(user.role);
      setCurrentUser(user.name);
    }
    fetchTasks(); // Refresh tasks immediately
  };

  return (
    <div className="task-container">
      <div className="auth-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Mock Authentication</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="user-select">Login as:</label>
          <select 
            id="user-select" 
            value={currentUser ? Object.keys(mockUsers).find(key => mockUsers[key].name === currentUser) : ''}
            onChange={(e) => handleUserLogin(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">-- Select User --</option>
            <option value="john.manager@example.com">John Smith (Manager)</option>
            <option value="jane.hr@example.com">Jane Wilson (HR)</option>
            <option value="admin@example.com">Admin User (All Tasks)</option>
          </select>
          
          {currentUser && (
            <div style={{ 
              marginLeft: '10px', 
              backgroundColor: currentRole === 'manager' ? '#e6f7ff' : currentRole === 'hr' ? '#f6ffed' : '#f2f2f2',
              padding: '5px 10px',
              borderRadius: '4px',
              border: `1px solid ${currentRole === 'manager' ? '#91d5ff' : currentRole === 'hr' ? '#b7eb8f' : '#d9d9d9'}`
            }}>
              Logged in as: <strong>{currentUser}</strong> ({currentRole.toUpperCase()})
            </div>
          )}
        </div>
      </div>

      <h2>
        {!currentRole 
          ? 'Select a User to View Tasks' 
          : currentRole === 'all' 
            ? 'All Pending Tasks' 
            : currentRole === 'manager' 
              ? 'Manager Approval Tasks' 
              : 'HR Approval Tasks'
        }
      </h2>
      
      {message && (
        <div className={`${message.type}-message`}>
          {message.text}
        </div>
      )}
      
      {loading && <p>Loading tasks...</p>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!currentRole && !loading && !error && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fafafa', 
          borderRadius: '5px',
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <p style={{ fontSize: '16px' }}>Please select a user from the dropdown above to view relevant tasks.</p>
          <p style={{ color: '#888' }}>
            Manager users can only approve manager tasks<br/>
            HR users can only approve HR tasks<br/>
            Admin users can view and approve all tasks
          </p>
        </div>
      )}
      
      {currentRole && !loading && !error && tasks.length === 0 && (
        <p>No pending tasks found for {currentRole === 'all' ? 'any role' : `${currentRole} role`}. Check back later.</p>
      )}
      
      {tasks.map((task) => (
        <div key={task.jobKey} className="task-card" style={{
          borderLeft: task.role === 'manager' ? '5px solid #1890ff' : task.role === 'hr' ? '5px solid #52c41a' : '5px solid #d9d9d9'
        }}>
          <h3>{task.role === 'manager' ? 'Manager Approval' : (task.role === 'hr' ? 'HR Approval' : 'Leave Request')}</h3>
          <p><strong>Requester:</strong> {task.variables.requester || 'Anonymous'}</p>
          <p><strong>Reason:</strong> {task.variables.reason}</p>
          <p><strong>Days Requested:</strong> {task.variables.days}</p>
          <p><strong>Submitted:</strong> {formatDate(task.timestamp)}</p>
          <p><strong>Step:</strong> {task.role || 'Review'}</p>
          
          <div className="task-actions">
            <button 
              className="button-approve"
              onClick={() => handleDecision(task.jobKey, true, task.role)}
              disabled={currentRole !== 'all' && currentRole !== task.role}
            >
              Approve
            </button>
            <button 
              className="button-reject"
              onClick={() => handleDecision(task.jobKey, false, task.role)}
              disabled={currentRole !== 'all' && currentRole !== task.role}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;