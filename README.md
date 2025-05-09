# Camunda Zeebe Leave Approval System

A full-stack leave request approval workflow application built with Camunda Zeebe, Node.js, and React. This application demonstrates a multi-stage approval process where leave requests go through both manager and HR approval stages, with Role-Based Access Control (RBAC) for user permissions management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Key Components](#key-components)
- [Role-Based Access Control](#role-based-access-control)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Future Improvements](#future-improvements)

## Overview

This application showcases how Camunda Zeebe can be used to implement business process workflows in a modern JavaScript application. It simulates a company's leave request approval system where employees submit leave requests that need to be approved by both a manager and an HR representative in sequence. The system includes comprehensive role-based access control to manage permissions.

![Application Preview](https://placeholder-for-screenshot.png)

## Features

- **Multi-Stage Approval Process**: Leave requests go through a two-step approval process (manager approval followed by HR approval)
- **Role-Based Task Management**: Different types of users (managers, HR representatives) see only tasks relevant to them
- **Real-Time Updates**: The task list refreshes automatically to show the current state
- **Authentication System**: User authentication with role-based permissions
- **RBAC Management**: Administrative interface for managing roles, permissions, and users
- **BPMN Workflow**: Business process defined using the BPMN 2.0 standard
- **Error Handling**: Comprehensive error handling and user feedback throughout the process

## Architecture

The application follows a client-server architecture:

- **Frontend**: React.js application for the user interface
- **Backend**: Node.js with Express for API endpoints
- **Process Engine**: Camunda Zeebe for workflow orchestration
- **Authentication**: JWT-based authentication with role-based access control

## Key Components

- **Leave Request Submission Form**: Allows employees to submit new leave requests
- **Task List**: Displays pending tasks for managers and HR representatives
- **RBAC Management**: Interface for administrators to manage roles and permissions
- **User Authentication**: Login system with role-based access

## Role-Based Access Control

The RBAC system includes the following components:

### User Roles

- **Admin**: Full access to all system features, including RBAC management
- **Manager**: Approves leave requests, views tasks, creates new tasks
- **HR**: Reviews and approves leave requests after manager approval
- **Employee**: Submits leave requests, views own request status

### Permissions

Permissions are granular capabilities assigned to roles:

- **create_all**: Create any resource in the system
- **read_all**: Read any resource in the system
- **update_all**: Update any resource in the system
- **delete_all**: Delete any resource in the system
- **create_request**: Create leave requests
- **read_own**: Read own leave requests
- **update_task**: Update task status (approve/reject)
- **create_task**: Create new tasks

### RBAC Management

The RBAC management interface allows administrators to:

1. Create, update, and delete user roles
2. Create, update, and delete permissions
3. Assign permissions to roles
4. Manage users and their role assignments

### Security Features

The system includes several security enhancements:

1. **Session Management**: User sessions expire after 30 minutes of inactivity
2. **Session Timeout Warnings**: Users receive a warning 2 minutes before session expiration
3. **Session Refresh**: User activity automatically extends the session
4. **Email Notifications**: Users receive email notifications when their roles or permissions change
5. **Secure Authentication**: Password handling for user accounts

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

1. Select a user role from the login screen:
   - **Admin**: Full access to all features including RBAC management
   - **Manager**: Can approve/reject leave requests at the manager stage
   - **HR**: Can approve/reject leave requests at the HR stage
   - **Employee**: Can submit leave requests

2. Submit a new leave request using the form (if you have permission)
3. As a manager, approve/reject manager tasks
4. As HR, approve/reject HR tasks (after manager approval)
5. As admin, you can manage users, roles, and permissions through the RBAC management tab

### Troubleshooting

If you encounter any issues with the application, please refer to the [Troubleshooting Guide](TROUBLESHOOTING.md) 
which provides step-by-step instructions for common issues.

### Starting the Application

You can start both the backend and frontend together using the provided PowerShell script:

```powershell
.\start-app.ps1
```

This script will:
- Start both backend (Node.js) and frontend (React) servers
- Check for port conflicts before starting
- Monitor and auto-restart servers if they crash
- Display login credentials for testing

If you prefer to start the servers separately:

1. Start the backend server:
   ```powershell
   node index.js
   ```

2. In a separate terminal, start the frontend development server:
   ```powershell
   cd frontend
   npm start
   ```

## Future Improvements

1. **Persistent Storage**: Replace in-memory task storage with a database solution
2. ~~**Real Authentication**~~: ✅ Implemented proper user authentication and authorization
3. **Process History**: Display process history and audit trail
4. ~~**Email Notifications**~~: ✅ Implemented email notifications for permission changes
5. **Mobile Responsiveness**: Enhance the UI for better mobile experience
6. **Process Visualization**: Include a visual representation of the workflow status
7. **Advanced Workflows**: Add more complex workflows with parallel approvals, escalations, etc.
8. **Metrics & Analytics**: Add dashboards for process performance and bottlenecks
9. ~~**User Management**~~: ✅ Implemented proper user management with role assignments
10. **Process Versioning**: Support for multiple versions of the same process definition

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Camunda for the Zeebe workflow engine
- The Node.js and React communities
