const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { ZBClient } = require('zeebe-node');
const nodemailer = require('nodemailer');
const winston = require('winston');

// Enhanced configuration
const config = {
  port: process.env.PORT || 3002,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key',
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leave_approval_system'
  },
  zeebe: {
    gatewayAddress: process.env.ZEEBE_ADDRESS || 'localhost:26500',
    useTLS: false
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || ''
  }
};

// Enhanced logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'leave-approval' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
let db;
async function initDatabase() {
  try {
    db = await mysql.createConnection(config.database);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Email service
const emailTransporter = nodemailer.createTransporter({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

// Zeebe client with enhanced error handling
const zbc = new ZBClient({
  gatewayAddress: config.zeebe.gatewayAddress,
  useTLS: config.zeebe.useTLS,
  onConnectionError: () => logger.error('Zeebe connection lost'),
  onReady: () => logger.info('Zeebe client ready')
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Enhanced worker for manager approval
zbc.createWorker({
  taskType: 'manager-approval',
  taskHandler: async (job) => {
    try {
      logger.info(`Manager approval task received: ${job.key}`);
      
      // Store in database instead of memory
      await db.execute(
        'INSERT INTO pending_tasks (job_key, process_instance_key, variables, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        [job.key, job.processInstanceKey, JSON.stringify(job.variables), 'manager']
      );

      // Send notification email to managers
      await sendNotificationEmail('manager', job.variables);

      logger.info(`Manager approval task stored: ${job.key}`);
    } catch (error) {
      logger.error('Error handling manager approval task:', error);
    }
  },
  timeout: 600000, // 10 minutes
  loglevel: 'INFO'
});

// Enhanced worker for HR approval
zbc.createWorker({
  taskType: 'hr-approval',
  taskHandler: async (job) => {
    try {
      logger.info(`HR approval task received: ${job.key}`);
      
      await db.execute(
        'INSERT INTO pending_tasks (job_key, process_instance_key, variables, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        [job.key, job.processInstanceKey, JSON.stringify(job.variables), 'hr']
      );

      await sendNotificationEmail('hr', job.variables);

      logger.info(`HR approval task stored: ${job.key}`);
    } catch (error) {
      logger.error('Error handling HR approval task:', error);
    }
  },
  timeout: 600000,
  loglevel: 'INFO'
});

// Enhanced notification system
async function sendNotificationEmail(role, variables) {
  try {
    const [users] = await db.execute(
      'SELECT email, name FROM users WHERE role = ? OR role = "admin"',
      [role]
    );

    for (const user of users) {
      const mailOptions = {
        from: config.email.user,
        to: user.email,
        subject: `New Leave Request - ${role.toUpperCase()} Approval Required`,
        html: `
          <h2>Leave Request Approval Required</h2>
          <p>Dear ${user.name},</p>
          <p>A new leave request requires your approval:</p>
          <ul>
            <li><strong>Requester:</strong> ${variables.requester}</li>
            <li><strong>Reason:</strong> ${variables.reason}</li>
            <li><strong>Days:</strong> ${variables.days}</li>
            <li><strong>Start Date:</strong> ${variables.startDate || 'Not specified'}</li>
            <li><strong>End Date:</strong> ${variables.endDate || 'Not specified'}</li>
          </ul>
          <p>Please log in to the system to review and approve/reject this request.</p>
        `
      };

      await emailTransporter.sendMail(mailOptions);
    }
  } catch (error) {
    logger.error('Error sending notification email:', error);
  }
}

// Enhanced API endpoints

// User authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    // In real implementation, compare with hashed password
    // const validPassword = await bcrypt.compare(password, user.password);
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced get tasks with database
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT pt.*, lr.leave_type, lr.start_date, lr.end_date, lr.status,
             u.name as requester_name, u.department
      FROM pending_tasks pt
      LEFT JOIN leave_requests lr ON pt.process_instance_key = lr.process_instance_key
      LEFT JOIN users u ON lr.requester_id = u.id
      WHERE pt.completed = FALSE
    `;
    
    const params = [];
    
    if (req.user.role !== 'admin') {
      query += ' AND pt.role = ?';
      params.push(req.user.role);
    }
    
    query += ' ORDER BY pt.created_at DESC';
    
    const [tasks] = await db.execute(query, params);
    
    res.json(tasks.map(task => ({
      ...task,
      variables: JSON.parse(task.variables)
    })));
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Enhanced process start with database tracking
app.post('/api/start-process', authenticateToken, async (req, res) => {
  try {
    const { reason, days, startDate, endDate, leaveType } = req.body;
    
    // Start Zeebe process
    const result = await zbc.createProcessInstance({
      bpmnProcessId: 'LeaveApprovalProcess',
      variables: {
        reason,
        days: parseInt(days),
        startDate,
        endDate,
        leaveType,
        requester: req.user.name,
        requesterId: req.user.id,
        requesterEmail: req.user.email
      }
    });
    
    // Store in database
    await db.execute(
      `INSERT INTO leave_requests 
       (process_instance_key, requester_id, leave_type, start_date, end_date, days_requested, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [result.processInstanceKey, req.user.id, leaveType, startDate, endDate, days, reason]
    );
    
    logger.info(`Leave request created: ${result.processInstanceKey} by user ${req.user.id}`);
    
    res.json({
      success: true,
      processInstanceKey: result.processInstanceKey,
      message: 'Leave request submitted successfully'
    });
  } catch (error) {
    logger.error('Error starting process:', error);
    res.status(500).json({ error: 'Failed to start process' });
  }
});

// Enhanced complete task with audit trail
app.post('/api/complete', authenticateToken, async (req, res) => {
  try {
    const { jobKey, approved, comments } = req.body;
    
    // Get task details
    const [tasks] = await db.execute(
      'SELECT * FROM pending_tasks WHERE job_key = ?',
      [jobKey]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks[0];
    const role = task.role;
    
    // Complete Zeebe job
    const variableName = role === 'manager' ? 'approvedByManager' : 'approvedByHR';
    await zbc.completeJob({
      jobKey,
      variables: {
        [variableName]: approved,
        [`${role}Comments`]: comments || '',
        [`${role}ApprovedBy`]: req.user.name,
        [`${role}ApprovedAt`]: new Date().toISOString()
      }
    });
    
    // Update database
    await db.execute(
      'UPDATE pending_tasks SET completed = TRUE, completed_at = NOW() WHERE job_key = ?',
      [jobKey]
    );
    
    // Add to approval history
    await db.execute(
      `INSERT INTO approval_history 
       (leave_request_id, approver_id, action, comments) 
       VALUES ((SELECT id FROM leave_requests WHERE process_instance_key = ?), ?, ?, ?)`,
      [task.process_instance_key, req.user.id, approved ? 'approved' : 'rejected', comments]
    );
    
    // Send notification to requester
    const variables = JSON.parse(task.variables);
    await sendStatusUpdateEmail(variables.requesterEmail, approved, role, comments);
    
    logger.info(`Task ${jobKey} completed by ${req.user.name}: ${approved ? 'approved' : 'rejected'}`);
    
    res.json({
      success: true,
      message: `Task ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    logger.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Send status update email
async function sendStatusUpdateEmail(email, approved, role, comments) {
  try {
    const mailOptions = {
      from: config.email.user,
      to: email,
      subject: `Leave Request ${approved ? 'Approved' : 'Rejected'} by ${role.toUpperCase()}`,
      html: `
        <h2>Leave Request Update</h2>
        <p>Your leave request has been <strong>${approved ? 'approved' : 'rejected'}</strong> by ${role}.</p>
        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        <p>You can check the full status in the system.</p>
      `
    };

    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    logger.error('Error sending status update email:', error);
  }
}

// Dashboard analytics
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM leave_requests
      WHERE requester_id = ? OR ? IN ('admin', 'hr', 'manager')
    `, [req.user.id, req.user.role]);
    
    res.json(stats[0]);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await initDatabase();
    
    app.listen(config.port, () => {
      logger.info(`Enhanced backend running on http://localhost:${config.port}`);
      logger.info(`Connecting to Zeebe at ${config.zeebe.gatewayAddress}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  if (db) await db.end();
  await zbc.close();
  process.exit(0);
});

startServer();
