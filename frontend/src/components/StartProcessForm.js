import React, { useState } from 'react';
import axios from 'axios';

const StartProcessForm = () => {
  const [formData, setFormData] = useState({
    requester: '',
    reason: '',
    days: '',
    leaveType: 'personal',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const leaveTypes = [
    { value: 'vacation', label: 'Vacation' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'medical', label: 'Medical Leave' }
  ];

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
      const response = await axios.post('http://localhost:3002/api/start-process', formData);
      
      setMessage({
        type: 'success',
        text: `Enhanced leave request submitted successfully! Process ID: ${response.data.processInstanceKey}`
      });

      // Reset form
      setFormData({
        requester: '',
        reason: '',
        days: '',
        leaveType: 'personal',
        startDate: '',
        endDate: ''
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
      <h2>Submit Enhanced Leave Request</h2>
      
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
          <label htmlFor="leaveType">Leave Type</label>
          <select
            id="leaveType"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            required
          >
            {leaveTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="days">Number of Days</label>
          <input
            type="number"
            id="days"
            name="days"
            min="1"
            max="365"
            value={formData.days}
            onChange={handleChange}
            required
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            • 1-3 days (Personal): Auto-approved<br/>
            • 4-10 days: Manager approval required<br/>
            • 11+ days or Special leaves: Manager + HR approval
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required={parseInt(formData.days) > 5}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required={parseInt(formData.days) > 5}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="reason">Reason for Leave</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows="4"
            placeholder="Please provide a detailed reason for your leave request..."
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="button-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Enhanced Leave Request'}
        </button>
      </form>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <h4>How the Enhanced Process Works:</h4>
        <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li><strong>Validation:</strong> Your request is automatically validated</li>
          <li><strong>Auto-approval:</strong> Short personal leaves (≤3 days) are auto-approved</li>
          <li><strong>Manager approval:</strong> Other requests go to your manager first</li>
          <li><strong>HR approval:</strong> Long leaves (&gt;10 days) or special types need HR approval</li>
          <li><strong>Escalation:</strong> If manager doesn't respond in 48h, it goes to HR</li>
          <li><strong>Notifications:</strong> You'll be notified at each step</li>
          <li><strong>Calendar:</strong> Approved leaves are automatically added to calendar</li>
        </ul>
      </div>
    </div>
  );
};

export default StartProcessForm;