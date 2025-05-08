const express = require('express');
const cors = require('cors');
const { ZBClient } = require('zeebe-node');

const app = express();
app.use(cors());
app.use(express.json());

// Create a Zeebe client that connects to the local Zeebe gateway
const zbc = new ZBClient({
  gatewayAddress: 'localhost:26500', // Default Zeebe gateway address
  useTLS: false // Set to true if your Zeebe instance uses TLS
});

// Store pending tasks in memory (in a real application, you'd use a database)
let pendingTasks = [];

// Create a worker that subscribes to the 'manual-review' task type
zbc.createWorker({
  taskType: 'manual-review',
  taskHandler: async (job) => {
    console.log('Received manual review task:', job.key, job.variables);
    
    // Check for duplicate jobs before adding to pendingTasks
    if (!pendingTasks.find(task => task.jobKey === job.key)) {
      // Store the job in our pending tasks
      pendingTasks.push({
        jobKey: job.key,
        variables: job.variables,
        timestamp: new Date()
      });
    }
    // Do NOT complete the job here. It will be completed via the /api/complete endpoint.
  },
  loglevel: 'INFO',
  // Increase timeout to allow more time for manual review (e.g., 5 minutes)
  timeout: 300000 
});

// Create workers for the two approval stages
// Manager Approval Worker
zbc.createWorker({
  taskType: 'manual-review-manager',
  taskHandler: async (job) => {
    console.log('Manager approval task received:', job.key);
    if (!pendingTasks.find(task => task.jobKey === job.key)) {
      pendingTasks.push({
        jobKey: job.key,
        variables: job.variables,
        role: 'manager',
        timestamp: new Date()
      });
    }
  },
  timeout: 300000,
  loglevel: 'INFO'
});

// HR Approval Worker
zbc.createWorker({
  taskType: 'manual-review-hr',
  taskHandler: async (job) => {
    console.log('HR approval task received:', job.key);
    if (!pendingTasks.find(task => task.jobKey === job.key)) {
      pendingTasks.push({
        jobKey: job.key,
        variables: job.variables,
        role: 'hr',
        timestamp: new Date()
      });
    }
  },
  timeout: 300000,
  loglevel: 'INFO'
});

// API endpoint to get all pending tasks
app.get('/api/tasks', (req, res) => {
  res.json(pendingTasks);
});

// API endpoint to complete a task with approval or rejection
app.post('/api/complete', async (req, res) => {
  const { jobKey, approved, role } = req.body;
  
  try {
    // Determine which variable to set based on the role
    const variableName = role === 'manager' ? 'approvedByManager' : 'approvedByHR';
    
    // Complete the job with the appropriate approval variable
    await zbc.completeJob({
      jobKey,
      variables: {
        [variableName]: approved
      }
    });
    
    // Remove the job from our pending tasks
    pendingTasks = pendingTasks.filter(task => task.jobKey !== jobKey);
    
    res.status(200).json({ 
      success: true, 
      message: `Task completed by ${role || 'reviewer'} successfully` 
    });
  } catch (error) {
    console.error(`Error completing job for ${role || 'reviewer'}:`, error);
    res.status(500).json({ success: false, message: 'Failed to complete task' });
  }
});

// API endpoint to start a new process instance
app.post('/api/start-process', async (req, res) => {
  try {
    const { reason, days, requester } = req.body; // Added requester here
    
    const result = await zbc.createProcessInstance({
      bpmnProcessId: 'LeaveApprovalProcess',
      variables: {
        reason,
        days,
        requester: requester || 'Anonymous' // Use provided requester or default
      }
    });
    
    res.status(200).json({
      success: true,
      processInstanceKey: result.processInstanceKey,
      message: 'Process started successfully'
    });
  } catch (error) {
    console.error('Error starting process:', error);
    res.status(500).json({ success: false, message: 'Failed to start process' });
  }
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('Connecting to Zeebe at localhost:26500');
});