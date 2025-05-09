const express = require('express');
const cors = require('cors');
const { ZBClient } = require('zeebe-node');
const rbacRoutes = require('./rbac-api');

const app = express();
app.use(cors());
app.use(express.json());

// Create a Zeebe client that connects to the local Zeebe gateway
const zbc = new ZBClient({
  gatewayAddress: 'localhost:26500', // Default Zeebe gateway address
  useTLS: false // Set to true if your Zeebe instance uses TLS
});

// Store pending tasks and completed tasks in memory (in a real application, you'd use a database)
let pendingTasks = [];
let completedTasks = []; // History of completed tasks

// Create a worker that subscribes to the 'manual-review' task type
zbc.createWorker({
  taskType: 'manual-review',
  taskHandler: async (job) => {
    console.log('Received manual review task:', job.key, job.variables);
    console.log('Manual review job details:', JSON.stringify(job, null, 2)); // Log the full job object as JSON
    
    // Check for duplicate jobs before adding to pendingTasks
    if (!pendingTasks.find(task => task.jobKey === job.key)) {
      // Store the current time as the received time
      const receivedTime = new Date();
      
      // Store the job in our pending tasks
      pendingTasks.push({
        jobKey: job.key,
        variables: job.variables,
        processInstanceKey: job.processInstanceKey || 'Unknown',
        timestamp: receivedTime,
        receivedAt: receivedTime
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
    console.log('Manager job details:', JSON.stringify(job, null, 2)); // Log the full job object to check properties
      
    if (!pendingTasks.find(task => task.jobKey === job.key)) {
      // Store the current time as the received time
      const receivedTime = new Date();
      
      pendingTasks.push({
        jobKey: job.key,
        variables: job.variables,
        role: 'manager',
        processInstanceKey: job.processInstanceKey || 'Unknown',
        // Don't use job.created as it might be undefined or incorrect
        timestamp: receivedTime,
        receivedAt: receivedTime
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
    console.log('HR job details:', JSON.stringify(job, null, 2)); // Log to check properties
    
    if (!pendingTasks.find(task => task.jobKey === job.key)) {
      // Store the current time as the received time
      const receivedTime = new Date();
      
      pendingTasks.push({
        jobKey: job.key,
        variables: job.variables,
        role: 'hr',
        processInstanceKey: job.processInstanceKey || 'Unknown',
        timestamp: receivedTime,
        receivedAt: receivedTime
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

// API endpoint to get completed tasks
app.get('/api/tasks/history', (req, res) => {
  res.json(completedTasks);
});

// API endpoint to get all tasks (both pending and completed)
app.get('/api/tasks/all', (req, res) => {
  res.json([...pendingTasks, ...completedTasks]);
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
    
    // Find the task before removing it from pending
    const completedTask = pendingTasks.find(task => task.jobKey === jobKey);
    
    // Add to completed tasks with approval status and time
    if (completedTask) {
      completedTasks.push({
        ...completedTask,
        approved,
        completedBy: role || 'reviewer',
        completedAt: new Date()
      });
    }
    
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

// Add RBAC routes
app.use('/api/rbac', rbacRoutes);

// Add authentication endpoint (simplified for demo)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Generate a mock token that expires in 30 minutes
  const expiresIn = 30 * 60 * 1000; // 30 minutes in ms
  const expirationTime = new Date().getTime() + expiresIn;
  const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
  
  // Check for admin
  if (username === 'admin' && password === 'admin') {
    res.json({
      user: { id: 1, username: 'admin', name: 'Admin User', email: 'admin@example.com' },
      role: 'admin',
      permissions: ['create_all', 'read_all', 'update_all', 'delete_all'],
      token: mockToken,
      expiresAt: expirationTime
    });
  } 
  // Check for manager
  else if (username === 'manager' && password === 'manager') {
    res.json({
      user: { id: 2, username: 'manager', name: 'John Manager', email: 'john.manager@example.com' },
      role: 'manager',
      permissions: ['read_all', 'update_task', 'create_task'],
      token: mockToken,
      expiresAt: expirationTime
    });
  } 
  // Check for HR
  else if (username === 'hr' && password === 'hr') {
    res.json({
      user: { id: 3, username: 'hr', name: 'Jane HR', email: 'jane.hr@example.com' },
      role: 'hr',
      permissions: ['read_all', 'update_task'],
      token: mockToken,
      expiresAt: expirationTime
    });
  } 
  // Check for employee
  else if (username === 'employee' && password === 'employee') {
    res.json({
      user: { id: 4, username: 'employee', name: 'Employee User', email: 'employee@example.com' },
      role: 'employee',
      permissions: ['create_request', 'read_own'],
      token: mockToken,
      expiresAt: expirationTime
    });
  } 
  else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Add a debug endpoint to help troubleshoot task issues
app.get('/api/debug/tasks', (req, res) => {
  // Get information about all tasks in the system
  const taskInfo = {
    totalPendingTasks: pendingTasks.length,
    totalCompletedTasks: completedTasks.length,
    managerTasks: pendingTasks.filter(task => task.role === 'manager').length,
    hrTasks: pendingTasks.filter(task => task.role === 'hr').length,
    unassignedTasks: pendingTasks.filter(task => !task.role).length,
    pendingTaskDetails: pendingTasks.map(task => ({
      jobKey: task.jobKey,
      processInstanceKey: task.processInstanceKey,
      role: task.role || 'unassigned',
      requester: task.variables.requester || 'Anonymous',
      timestamp: task.timestamp,
      receivedAt: task.receivedAt,
      variableCount: Object.keys(task.variables).length
    })),
    completedTaskDetails: completedTasks.slice(-5).map(task => ({
      jobKey: task.jobKey,
      role: task.role || 'unassigned',
      requester: task.variables.requester || 'Anonymous',
      timestamp: task.timestamp,
      completedAt: task.completedAt,
      approved: task.approved
    }))
  };
  
  res.json(taskInfo);
});

// Add an endpoint to clear all tasks (for testing purposes)
// This should only be accessible to admin users in a real app
app.post('/api/debug/clear-tasks', (req, res) => {
  const originalCount = pendingTasks.length;
  pendingTasks = [];
  res.json({ 
    success: true, 
    message: `Cleared ${originalCount} tasks from the system`,
    clearedCount: originalCount
  });
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('Connecting to Zeebe at localhost:26500');
});