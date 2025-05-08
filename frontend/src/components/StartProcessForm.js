import React, { useState } from 'react';
import axios from 'axios';

const StartProcessForm = () => {
  const [formData, setFormData] = useState({
    requester: '',
    reason: '',
    days: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

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
      const response = await axios.post('http://localhost:3001/api/start-process', formData);
      
      setMessage({
        type: 'success',
        text: `Leave request submitted successfully! Process ID: ${response.data.processInstanceKey}`
      });

      // Reset form
      setFormData({
        requester: '',
        reason: '',
        days: ''
      });
    } catch (error) {
      console.error('Error starting process:', error);
      setMessage({
        type: 'error',
        text: 'Failed to submit leave request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Submit Leave Request</h2>
      
      {message && (
        <div className={`${message.type}-message`}>
          {message.text}
        </div>
      )}
      
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