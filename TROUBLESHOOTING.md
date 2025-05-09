## Troubleshooting Guide for Camunda Zeebe Leave Approval System

### Issue: Not seeing tasks when logged in as manager

If you're not seeing tasks when logged in as a manager, follow these steps to troubleshoot:

#### 1. Make sure you're following the correct process flow

The leave approval workflow has several stages:

1. **Submit a request** (as an Employee)
2. **Manager approval** (as a Manager)
3. **HR approval** (as HR, only after manager approval)

#### 2. Step-by-Step Testing Instructions

**Step 1: Submit a new leave request**

1. Log in as an Employee (username: `employee`, password: `employee`)
2. Navigate to "Request Leave" tab
3. Fill in the form with:
   - Your name
   - Reason for leave
   - Number of days
4. Submit the form
5. You should see a success message

**Step 2: Approve as a Manager**

1. Log out or directly switch roles
2. Log in as a Manager (username: `manager`, password: `manager`)
3. Navigate to "Pending Tasks" tab
4. You should now see the task submitted by the employee
5. Click "Approve" to move it to the HR stage

**Step 3: Approve as HR**

1. Log out or directly switch roles
2. Log in as HR (username: `hr`, password: `hr`)
3. Navigate to "Pending Tasks" tab
4. You should now see the task approved by the manager
5. Click "Approve" to complete the workflow

#### 3. Common Issues and Solutions

**No tasks appearing for Manager:**

- Make sure a leave request has been submitted
- Check if the backend server is running (check terminal output)
- Use the "Refresh Tasks Manually" button in the debug section
- Check the browser console for any API errors

**Tasks not advancing to next stage:**

- Ensure you clicked "Approve" not "Reject"
- Check if the task is assigned to the correct role
- Verify the BPMN workflow is correctly defined

**Can't see historical/completed tasks:**

- Switch to the "Completed Tasks" tab at the top of the task list
- If there are no completed tasks, process a task first
- Note that completed tasks are stored in memory and will be lost if the server restarts
- Each role can only see their own completed tasks (except admin who can see all)

**Authentication issues:**

- Make sure you're using the correct credentials
- Try logging out and back in
- Check if the token has expired (it lasts 30 minutes)

#### 4. Using the start-app.ps1 Script

The `start-app.ps1` script starts both the frontend and backend servers:

1. Open PowerShell
2. Navigate to the project directory:
   ```
   cd "C:\Users\iTz_M\Documents\vsprojects\Projects\camundaZebee-master"
   ```
3. Run the script:
   ```
   .\start-app.ps1
   ```
4. You should see both servers start
5. If there are issues:
   - Check for any error messages in the console
   - Make sure no other process is using ports 3000 or 3002
   - Verify all dependencies are installed

#### 5. Advanced Debugging

If you still encounter issues:

- Check the task list debug information section for insights
- Review the browser's developer tools Network tab to see API responses
- Examine the backend console logs for any errors
- Try restarting both frontend and backend servers

#### 6. Task History and Storage

- Task history is stored in memory and will be lost when the server restarts
- The "Completed Tasks" tab shows tasks that have been processed in the current server session
- For a production system, a database should be integrated to provide persistent storage
- Both pending and completed tasks can be viewed via the debug endpoint: http://localhost:3002/api/debug/tasks

Need more help? Contact the system administrator or developer.
