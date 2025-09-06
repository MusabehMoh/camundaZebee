-- Enhanced database schema for leave approval system
CREATE DATABASE leave_approval_system;
USE leave_approval_system;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('employee', 'manager', 'hr', 'admin') NOT NULL,
    department VARCHAR(100),
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    process_instance_key BIGINT UNIQUE NOT NULL,
    requester_id INT NOT NULL,
    leave_type ENUM('vacation', 'sick', 'personal', 'maternity', 'paternity') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id)
);

-- Approval history table
CREATE TABLE approval_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    leave_request_id INT NOT NULL,
    approver_id INT NOT NULL,
    action ENUM('approved', 'rejected') NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sample data
INSERT INTO users (email, name, role, department) VALUES
('john.manager@company.com', 'John Smith', 'manager', 'Engineering'),
('jane.hr@company.com', 'Jane Wilson', 'hr', 'Human Resources'),
('bob.employee@company.com', 'Bob Johnson', 'employee', 'Engineering'),
('admin@company.com', 'Admin User', 'admin', 'IT');
