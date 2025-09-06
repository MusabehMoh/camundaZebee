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

// Deploy the enhanced BPMN process on startup
async function deployEnhancedProcess() {
  try {
    console.log('Deploying enhanced leave approval process...');
    const result = await zbc.deployProcess('./enhanced-leave-approval.bpmn');
    
    if (result && result.deployments && result.deployments.length > 0) {
      console.log('✅ Enhanced process deployed successfully:', result.deployments[0].process.bpmnProcessId);
      console.log('Process version:', result.deployments[0].process.version);
    } else {
      console.log('✅ Process deployment completed (no details available)');
    }
  } catch (error) {
    console.error('❌ Failed to deploy enhanced process:', error.message);
    console.log('💡 Make sure Zeebe is running and the BPMN file is valid');
    // Don't exit, continue with existing functionality
  }
}

// Call deployment on startup
deployEnhancedProcess();

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

// Enhanced workers for the new BPMN process

// Validation Worker
zbc.createWorker({
  taskType: 'validate-leave-request',
  taskHandler: async (job) => {
    console.log('Validating leave request:', job.key);
    const { days, leaveType, startDate, endDate } = job.variables;
    
    // Enhanced validation logic
    let isValid = true;
    let validationErrors = [];
    
    // Check if days is reasonable
    if (days <= 0 || days > 365) {
      isValid = false;
      validationErrors.push('Invalid number of days');
    }
    
    // Check if dates are provided for longer leaves
    if (days > 5 && (!startDate || !endDate)) {
      isValid = false;
      validationErrors.push('Start and end dates required for leaves > 5 days');
    }
    
    // Check if leave type is valid
    const validLeaveTypes = ['vacation', 'sick', 'personal', 'maternity', 'paternity', 'medical'];
    if (!validLeaveTypes.includes(leaveType)) {
      isValid = false;
      validationErrors.push('Invalid leave type');
    }
    
    console.log(`Validation result: ${isValid ? 'VALID' : 'INVALID'}`, validationErrors);
    
    return job.complete({
      isValid,
      validationErrors,
      validatedAt: new Date().toISOString()
    });
  },
  timeout: 30000,
  loglevel: 'INFO'
});

// Auto Approval Worker
zbc.createWorker({
  taskType: 'auto-approve',
  taskHandler: async (job) => {
    console.log('Auto-approving leave request:', job.key);
    const { requester, days, leaveType } = job.variables;
    
    console.log(`Auto-approved: ${requester} - ${days} days of ${leaveType} leave`);
    
    return job.complete({
      autoApproved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: 'System (Auto-approval)',
      finalStatus: 'approved'
    });
  },
  timeout: 30000,
  loglevel: 'INFO'
});

// Calendar Update Worker
zbc.createWorker({
  taskType: 'update-calendar',
  taskHandler: async (job) => {
    console.log('Updating calendar for approved leave:', job.key);
    const { requester, startDate, endDate, days, leaveType } = job.variables;
    
    // Here you would integrate with actual calendar service
    // For now, just simulate the update
    console.log(`Calendar updated: ${requester} - ${leaveType} leave from ${startDate} to ${endDate}`);
    
    return job.complete({
      calendarUpdated: true,
      calendarEventId: `event_${Date.now()}`,
      updatedAt: new Date().toISOString()
    });
  },
  timeout: 60000,
  loglevel: 'INFO'
});

// Notification Worker
zbc.createWorker({
  taskType: 'send-notification',
  taskHandler: async (job) => {
    console.log('Sending notifications:', job.key);
    const { requester, finalStatus, approvedBy, rejectedBy, validationErrors } = job.variables;
    
    // Simulate sending email/SMS notifications
    if (finalStatus === 'approved') {
      console.log(`✅ NOTIFICATION: Leave request APPROVED for ${requester} by ${approvedBy}`);
    } else if (finalStatus === 'rejected') {
      console.log(`❌ NOTIFICATION: Leave request REJECTED for ${requester} by ${rejectedBy}`);
    } else if (validationErrors && validationErrors.length > 0) {
      console.log(`⚠️ NOTIFICATION: Leave request INVALID for ${requester}: ${validationErrors.join(', ')}`);
    }
    
    return job.complete({
      notificationSent: true,
      sentAt: new Date().toISOString()
    });
  },
  timeout: 30000,
  loglevel: 'INFO'
});

// Escalation Worker
zbc.createWorker({
  taskType: 'escalate-to-hr',
  taskHandler: async (job) => {
    console.log('Escalating to HR due to manager timeout:', job.key);
    const { requester, days, reason } = job.variables;
    
    console.log(`🚨 ESCALATION: Manager didn't respond in 48h. Escalating ${requester}'s ${days}-day leave request to HR`);
    
    return job.complete({
      escalatedToHR: true,
      escalationReason: 'Manager timeout (48 hours)',
      escalatedAt: new Date().toISOString()
    });
  },
  timeout: 30000,
  loglevel: 'INFO'
});

// Create workers for the two approval stages
// Manager Approval Worker
zbc.createWorker({
  taskType: 'manager-approval',
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
    // Do NOT complete the job here - it will be completed via /api/complete endpoint
    console.log('Manager approval task added to pending list (will NOT appear in Camunda Tasklist)');
  },
  timeout: 600000, // 10 minutes timeout
  loglevel: 'INFO'
});

// HR Approval Worker
zbc.createWorker({
  taskType: 'hr-approval',
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
    // Do NOT complete the job here - it will be completed via /api/complete endpoint
    console.log('HR approval task added to pending list (will NOT appear in Camunda Tasklist)');
  },
  timeout: 600000, // 10 minutes timeout
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
    const { reason, days, requester, leaveType, startDate, endDate } = req.body;
    
    const result = await zbc.createProcessInstance({
      bpmnProcessId: 'EnhancedLeaveApprovalProcess', // Updated to use enhanced process
      variables: {
        reason,
        days: parseInt(days),
        requester: requester || 'Anonymous',
        leaveType: leaveType || 'personal',
        startDate: startDate || '',
        endDate: endDate || '',
        requestDate: new Date().toISOString(),
        // Add validation flags
        isValid: true, // Will be determined by validation service
        managerEmail: 'manager@company.com' // In real app, get from user profile
      }
    });
    
    res.status(200).json({
      success: true,
      processInstanceKey: result.processInstanceKey,
      message: 'Enhanced leave request submitted successfully'
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