import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'
  
  // Use the auth context
  const { currentUser, userRole, hasPermission, login, logout } = useAuth();

  // Function to fetch tasks from the backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // If no role or user is not authenticated, don't fetch tasks
      if (!userRole || !currentUser) {
        setTasks([]);
        setCompletedTasks([]);
        setLoading(false);
        return;
      }
      
      // Fetch pending tasks
      const response = await axios.get('http://localhost:3002/api/tasks');
      console.log('Fetched tasks:', response.data); // Debug log
      
      // Filter tasks based on user role
      let filteredTasks = response.data;
      if (userRole !== 'admin') {
        filteredTasks = response.data.filter(task => 
          task.role === userRole || !task.role // Include tasks without a role for backward compatibility
        );
      }
      
      setTasks(filteredTasks);
      
      // If the history endpoint is available, fetch completed tasks
      try {
        const historyResponse = await axios.get('http://localhost:3002/api/tasks/history');
        let filteredCompletedTasks = historyResponse.data;
        
        if (userRole !== 'admin') {
          filteredCompletedTasks = historyResponse.data.filter(task => 
            task.role === userRole || task.completedBy === userRole || !task.role
          );
        }
        
        setCompletedTasks(filteredCompletedTasks);
      } catch (historyError) {
        console.warn('Could not fetch task history:', historyError);
        setCompletedTasks([]);
      }
      
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
    console.log('User role or user changed, fetching tasks...');
    
    // Setup polling to refresh tasks every 5 seconds
    const intervalId = setInterval(() => {
      console.log('Polling for tasks...');
      fetchTasks();
    }, 5000);
    
    // Clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [userRole, currentUser]); // Re-run when userRole or currentUser changes

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
      
      // Refresh tasks to get the updated history
      fetchTasks();
      
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
    // If the date is the Unix epoch (Jan 1, 1970) or invalid, show current date instead
    const date = new Date(dateString);
    const epochDate = new Date(0); // Unix epoch
    
    // Check if date is invalid or close to Unix epoch (within a day)
    if (isNaN(date) || Math.abs(date - epochDate) < 24 * 60 * 60 * 1000) {
      const now = new Date();
      return "Current date (timestamp unavailable)";
    }
    
    // Format with 12-hour time: YYYY-MM-DD hh:MM:SS AM/PM
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0') + ' ' +
           String(hours).padStart(2, '0') + ':' +
           String(date.getMinutes()).padStart(2, '0') + ':' +
           String(date.getSeconds()).padStart(2, '0') + ' ' + ampm;
  };

  // Handle user login selection
  const handleUserLogin = (email) => {
    if (email === '') {
      // Log out
      logout();
    } else {
      // Login based on the selected mock user
      if (email === 'john.manager@example.com') {
        login('manager', 'manager');
      } else if (email === 'jane.hr@example.com') {
        login('hr', 'hr');
      } else if (email === 'admin@example.com') {
        login('admin', 'admin');
      }
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
            value={
              !currentUser ? '' :
              userRole === 'manager' ? 'john.manager@example.com' :
              userRole === 'hr' ? 'jane.hr@example.com' :
              userRole === 'admin' ? 'admin@example.com' : ''
            }
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
              backgroundColor: userRole === 'manager' ? '#e6f7ff' : userRole === 'hr' ? '#f6ffed' : '#f2f2f2',
              padding: '5px 10px',
              borderRadius: '4px',
              border: `1px solid ${userRole === 'manager' ? '#91d5ff' : userRole === 'hr' ? '#b7eb8f' : '#d9d9d9'}`
            }}>
              Logged in as: <strong>{currentUser.name || currentUser.username}</strong> ({userRole.toUpperCase()})
            </div>
          )}
        </div>
      </div>

      <h2>
        {!userRole 
          ? 'Select a User to View Tasks' 
          : userRole === 'admin' 
            ? 'Task Management Dashboard' 
            : userRole === 'manager' 
              ? 'Manager Task Dashboard' 
              : 'HR Task Dashboard'
        }
      </h2>
      
      {/* Task Tabs */}
      {userRole && (
        <div className="task-tabs" style={{ margin: '20px 0', borderBottom: '1px solid #ddd' }}>
          <button 
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: activeTab === 'pending' ? '#1890ff' : '#f0f0f0',
              color: activeTab === 'pending' ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer',
              borderTopLeftRadius: '5px',
              borderTopRightRadius: '5px'
            }}
          >
            Pending Tasks ({tasks.length})
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'completed' ? '#52c41a' : '#f0f0f0',
              color: activeTab === 'completed' ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer',
              borderTopLeftRadius: '5px',
              borderTopRightRadius: '5px'
            }}
          >
            Completed Tasks ({completedTasks.length})
          </button>
        </div>
      )}
      
      {/* Debug information */}
      <div className="debug-info" style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px', border: '1px solid #cce5ff' }}>
        <h4>Debug Information</h4>
        <p><strong>Current User:</strong> {currentUser ? currentUser.name : 'Not logged in'}</p>
        <p><strong>Role:</strong> {userRole || 'None'}</p>
        <p><strong>Can see tasks:</strong> {hasPermission('update_task') || hasPermission('read_all') ? 'Yes' : 'No'}</p>
        <p><strong>Pending tasks:</strong> {loading ? 'Loading...' : tasks.length}</p>
        <p><strong>Completed tasks:</strong> {loading ? 'Loading...' : completedTasks.length}</p>
        <button 
          onClick={fetchTasks} 
          style={{ 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Tasks Manually
        </button>
      </div>
      
      {message && (
        <div className={`${message.type}-message`} style={{
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: message.type === 'success' ? '#f6ffed' : '#fff1f0',
          border: `1px solid ${message.type === 'success' ? '#b7eb8f' : '#ffa39e'}`,
          borderRadius: '4px'
        }}>
          {message.text}
        </div>
      )}
      
      {loading && <p>Loading tasks...</p>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!userRole && !loading && !error && (
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
      
      {/* Display message when no tasks found in current tab */}
      {userRole && !loading && !error && 
        ((activeTab === 'pending' && tasks.length === 0) || 
         (activeTab === 'completed' && completedTasks.length === 0)) && (
        <div style={{ padding: '15px', backgroundColor: '#fffbe6', borderRadius: '5px', border: '1px solid #ffe58f' }}>
          <p><strong>No {activeTab} tasks found for {userRole === 'admin' ? 'any role' : `${userRole} role`}.</strong></p>
          
          {activeTab === 'pending' && (
            <>
              <p>This could be because:</p>
              <ul>
                <li>No leave requests have been submitted yet</li>
                <li>All submitted requests have already been processed</li>
                <li>Workflow hasn't reached your approval stage yet</li>
              </ul>
              <p>
                <strong>Try this:</strong> Login as an employee user and submit a new leave request, 
                then come back here to see and approve the task.
              </p>
            </>
          )}
          
          {activeTab === 'completed' && (
            <>
              <p>This could be because:</p>
              <ul>
                <li>You haven't processed any tasks yet</li>
                <li>The system was recently started and has no task history</li>
              </ul>
              <p>
                <strong>Try this:</strong> Process some pending tasks first, then check this tab again.
              </p>
            </>
          )}
        </div>
      )}
      
      {/* Pending Tasks Tab */}
      {activeTab === 'pending' && tasks.map((task) => (
        <div key={task.jobKey} className="task-card" style={{
          marginBottom: '15px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: task.role === 'manager' ? '5px solid #1890ff' : task.role === 'hr' ? '5px solid #52c41a' : '5px solid #d9d9d9'
        }}>
          <h3>{task.role === 'manager' ? 'Manager Approval' : (task.role === 'hr' ? 'HR Approval' : 'Leave Request')}</h3>
          <p><strong>Requester:</strong> {task.variables.requester || 'Anonymous'}</p>
          <p><strong>Reason:</strong> {task.variables.reason}</p>
          <p><strong>Days Requested:</strong> {task.variables.days}</p>
          <p><strong>Received:</strong> {formatDate(task.timestamp || task.receivedAt)}</p>
          <p><strong>Process ID:</strong> {task.processInstanceKey || 'Unknown'}</p>
          <p><strong>Step:</strong> {task.role || 'Review'}</p>
          
          <div className="task-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              className="button-approve"
              onClick={() => handleDecision(task.jobKey, true, task.role)}
              disabled={userRole !== 'admin' && userRole !== task.role}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (userRole !== 'admin' && userRole !== task.role) ? 'not-allowed' : 'pointer',
                opacity: (userRole !== 'admin' && userRole !== task.role) ? 0.5 : 1
              }}
            >
              Approve
            </button>
            <button 
              className="button-reject"
              onClick={() => handleDecision(task.jobKey, false, task.role)}
              disabled={userRole !== 'admin' && userRole !== task.role}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#f5222d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (userRole !== 'admin' && userRole !== task.role) ? 'not-allowed' : 'pointer',
                opacity: (userRole !== 'admin' && userRole !== task.role) ? 0.5 : 1
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
      
      {/* Completed Tasks Tab */}
      {activeTab === 'completed' && completedTasks.map((task) => (
        <div key={task.jobKey} className="completed-task-card" style={{
          marginBottom: '15px',
          padding: '15px',
          backgroundColor: '#fafafa',
          borderRadius: '5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: task.approved ? '5px solid #52c41a' : '5px solid #f5222d'
        }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '4px 8px', 
            borderRadius: '3px', 
            backgroundColor: task.approved ? '#f6ffed' : '#fff1f0',
            color: task.approved ? '#52c41a' : '#f5222d',
            fontSize: '14px',
            marginBottom: '10px'
          }}>
            {task.approved ? 'APPROVED' : 'REJECTED'}
          </div>
          
          <h3>{task.role === 'manager' ? 'Manager Approval' : (task.role === 'hr' ? 'HR Approval' : 'Leave Request')}</h3>
          <p><strong>Requester:</strong> {task.variables.requester || 'Anonymous'}</p>
          <p><strong>Reason:</strong> {task.variables.reason}</p>
          <p><strong>Days Requested:</strong> {task.variables.days}</p>
          <p><strong>Submitted:</strong> {formatDate(task.timestamp)}</p>
          <p><strong>Completed By:</strong> {task.completedBy || 'Unknown'}</p>
          <p><strong>Completed At:</strong> {formatDate(task.completedAt)}</p>
          
          <div style={{ 
            marginTop: '10px', 
            padding: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#888'
          }}>
            This task has been processed and cannot be modified.
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;