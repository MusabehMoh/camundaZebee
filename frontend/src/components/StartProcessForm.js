import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StartProcessForm = () => {
  const { currentUser, hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    requester: currentUser ? currentUser.name : '',
    reason: '',
    days: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Update requester when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        requester: currentUser.name
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Check if form is valid
      if (!formData.requester || !formData.reason || !formData.days || isNaN(Number(formData.days))) {
        throw new Error('Please fill in all fields correctly. Days must be a number.');
      }

      const response = await axios.post('http://localhost:3002/api/start-process', formData);
      
      setMessage({
        type: 'success',
        text: `Leave request submitted successfully! Process ID: ${response.data.processInstanceKey}`
      });

      // Reset form fields except requester
      setFormData({
        ...formData,
        reason: '',
        days: ''
      });
      
      // Show additional help message after successful submission
      setTimeout(() => {
        setMessage({
          type: 'info',
          text: 'Your request is now in the approval workflow. Log in as a manager to see and approve this task.'
        });
      }, 3000);
    } catch (error) {
      console.error('Error starting process:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to submit leave request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('create_request')) {
    return (
      <div className="form-container">
        <h2>Submit Leave Request</h2>
        <div className="error-message">
          You don't have permission to submit leave requests. Please contact your administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Submit Leave Request</h2>
      
      {message && (
        <div className={`${message.type}-message`}>
          {message.text}
        </div>
      )}
      
      {/* Workflow Help Guide */}
      <div style={{ 
        padding: '10px 15px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #bae7ff'
      }}>
        <h4 style={{ marginTop: '5px' }}>How to Test the Complete Workflow:</h4>
        <ol style={{ paddingLeft: '20px' }}>
          <li><strong>Step 1:</strong> Submit a leave request as an Employee (current view)</li>
          <li><strong>Step 2:</strong> Log in as a Manager to approve the first stage</li>
          <li><strong>Step 3:</strong> Log in as HR to approve the final stage</li>
        </ol>
        <p style={{ margin: '5px 0', fontSize: '0.9em' }}>
          <strong>Note:</strong> After submitting a request, go to "Pending Tasks" and login as Manager to see it.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="requester">Your Name</label>
          <input
            type="text"
            id="requester"
            name="requester"
            value={formData.requester}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="reason">Reason for Leave</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            placeholder="Why do you need time off?"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="days">Number of Days</label>
          <input
            type="number"
            id="days"
            name="days"
            min="1"
            max="30"
            value={formData.days}
            onChange={handleChange}
            required
            placeholder="How many days?"
          />
        </div>
        
        <button 
          type="submit" 
          className="button-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
};

export default StartProcessForm;