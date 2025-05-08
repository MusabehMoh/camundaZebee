import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Function to fetch tasks from the backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3002/api/tasks');
      setTasks(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
    
    // Setup polling to refresh tasks every 5 seconds
    const intervalId = setInterval(fetchTasks, 5000);
    
    // Clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

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

  return (
    <div className="task-container">
      <h2>Pending Leave Approval Tasks</h2>
      
      {message && (
        <div className={`${message.type}-message`}>
          {message.text}
        </div>
      )}
      
      {loading && <p>Loading tasks...</p>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && tasks.length === 0 && (
        <p>No pending tasks found. Check back later.</p>
      )}
      
      {tasks.map((task) => (
        <div key={task.jobKey} className="task-card">
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
            >
              Approve
            </button>
            <button 
              className="button-reject"
              onClick={() => handleDecision(task.jobKey, false, task.role)}
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