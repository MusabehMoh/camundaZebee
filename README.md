# Camunda Zeebe Leave Approval System

A full-stack leave request approval workflow application built with Camunda Zeebe, Node.js, and React. This application demonstrates a multi-stage approval process where leave requests go through both manager and HR approval stages.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Key Components](#key-components)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Future Improvements](#future-improvements)

## Overview

This application showcases how Camunda Zeebe can be used to implement business process workflows in a modern JavaScript application. It simulates a company's leave request approval system where employees submit leave requests that need to be approved by both a manager and an HR representative in sequence.

![Application Preview](https://placeholder-for-screenshot.png)

## Features

- **Multi-Stage Approval Process**: Leave requests go through a two-step approval process (manager approval followed by HR approval)
- **Role-Based Task Management**: Different types of users (managers, HR representatives) see only tasks relevant to them
- **Real-Time Updates**: The task list refreshes automatically to show the current state
- **Mock Authentication**: Simulated user roles for testing without implementing a full authentication system
- **BPMN Workflow**: Business process defined using the BPMN 2.0 standard
- **Error Handling**: Comprehensive error handling and user feedback throughout the process

## Architecture

The application consists of two main parts:

### Backend
- **Node.js** server with Express
- **Zeebe Node Client** to communicate with the Camunda Zeebe workflow engine
- RESTful API endpoints for task fetching and completion
- In-memory task storage (could be extended to use a database)

### Frontend
- **React** for building the user interface
- **Axios** for API communication
- Role-based component rendering
- Real-time polling for task updates

## Key Components

### Backend (`index.js`)

1. **Zeebe Client Setup**
   ```javascript
   const zbc = new ZBClient({
     gatewayAddress: 'localhost:26500',
     useTLS: false
   });
   ```

2. **Worker Definitions for Different Approval Stages**
   ```javascript
   // Manager Approval Worker
   zbc.createWorker({
     taskType: 'manual-review-manager',
     taskHandler: async (job) => {
       // Store job with manager role
     },
     timeout: 300000,
     loglevel: 'INFO'
   });

   // HR Approval Worker
   zbc.createWorker({
     taskType: 'manual-review-hr',
     taskHandler: async (job) => {
       // Store job with HR role
     },
     timeout: 300000,
     loglevel: 'INFO'
   });
   ```

3. **Role-Based Task Completion**
   ```javascript
   // Complete job with role-specific variable
   const variableName = role === 'manager' ? 'approvedByManager' : 'approvedByHR';
   await zbc.completeJob({
     jobKey,
     variables: {
       [variableName]: approved
     }
   });
   ```

### Frontend (`TaskList.js`)

1. **Role-Based Authentication**
   ```javascript
   // Mock user accounts
   const mockUsers = {
     'john.manager@example.com': { name: 'John Smith', role: 'manager' },
     'jane.hr@example.com': { name: 'Jane Wilson', role: 'hr' },
     'admin@example.com': { name: 'Admin User', role: 'all' }
   };
   ```

2. **Conditional Task Fetching**
   ```javascript
   // Only fetch tasks if a role is selected
   if (!currentRole) {
     setTasks([]);
     setLoading(false);
     return;
   }
   ```

3. **Role-Based Task Filtering**
   ```javascript
   // Filter tasks based on selected role
   if (currentRole !== 'all') {
     filteredTasks = response.data.filter(task => 
       task.role === currentRole || !task.role
     );
   }
   ```

4. **Conditional UI Rendering**
   ```javascript
   {!currentRole && !loading && !error && (
     <div style={{ padding: '20px', backgroundColor: '#fafafa' }}>
       <p>Please select a user from the dropdown above to view relevant tasks.</p>
     </div>
   )}
   ```

5. **Task-Specific Approval Controls**
   ```javascript
   <button 
     className="button-approve"
     onClick={() => handleDecision(task.jobKey, true, task.role)}
     disabled={currentRole !== 'all' && currentRole !== task.role}
   >
     Approve
   </button>
   ```

## How It Works

1. **Process Initialization**:
   - User submits a leave request with reason, number of days, and requester name
   - A new workflow instance is created in Zeebe with these variables

2. **Manager Approval Stage**:
   - The workflow reaches the manager approval task
   - The manager worker picks up the task and adds it to the pending tasks list with role='manager'
   - A manager user sees the task in their task list and can approve or reject it
   - The decision is stored in the 'approvedByManager' process variable

3. **HR Approval Stage**:
   - If the manager approves, the workflow proceeds to the HR approval task
   - The HR worker picks up the task and adds it to the pending tasks list with role='hr'
   - An HR user sees the task in their task list and can approve or reject it
   - The decision is stored in the 'approvedByHR' process variable

4. **Process Completion**:
   - The workflow completes based on the approval decisions
   - Both approvals lead to the leave request being approved
   - Any rejection leads to the leave request being denied

## Getting Started

### Prerequisites

- Node.js and npm installed
- Camunda Zeebe running locally (Docker setup recommended)
- Docker and Docker Compose (for running Zeebe)

### Setting Up Zeebe

1. Run Zeebe using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Verify that Zeebe is running:
   ```bash
   docker ps
   ```

### Installing and Running the Application

1. Clone the repository:
   ```bash
   git clone https://github.com/MusabehMoh/camundaZebee.git
   cd camundaZebee
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. Start the backend server:
   ```bash
   node index.js
   ```

5. In a separate terminal, start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

6. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Using the Application

1. Select a user role from the dropdown (Manager, HR, or Admin)
2. Submit a new leave request using the form
3. As a manager, approve/reject manager tasks
4. As HR, approve/reject HR tasks (after manager approval)
5. As admin, you can see and action all tasks

## Future Improvements

1. **Persistent Storage**: Replace in-memory task storage with a database solution
2. **Real Authentication**: Implement proper user authentication and authorization
3. **Process History**: Display process history and audit trail
4. **Email Notifications**: Send notifications when tasks are assigned or completed
5. **Mobile Responsiveness**: Enhance the UI for better mobile experience
6. **Process Visualization**: Include a visual representation of the workflow status
7. **Advanced Workflows**: Add more complex workflows with parallel approvals, escalations, etc.
8. **Metrics & Analytics**: Add dashboards for process performance and bottlenecks
9. **User Management**: Add proper user management with role assignments
10. **Process Versioning**: Support for multiple versions of the same process definition

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Camunda for the Zeebe workflow engine
- The Node.js and React communities
