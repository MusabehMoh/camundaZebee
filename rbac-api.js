// RBAC Backend API

// Import required modules
const express = require("express");
const router = express.Router();
const { sendRoleChangeNotification, sendPermissionChangeNotification, sendNewUserNotification } = require('./email-service');

// In-memory store for roles, permissions, and users (in production, use a database)
let roles = [
  {
    id: 1,
    name: "admin",
    description: "Administrator with full access",
    permissions: ["create_all", "read_all", "update_all", "delete_all"],
  },
  {
    id: 2,
    name: "manager",
    description: "Team manager who can approve requests",
    permissions: ["read_all", "update_task", "create_task"],
  },
  {
    id: 3,
    name: "hr",
    description: "HR personnel who reviews leave requests",
    permissions: ["read_all", "update_task"],
  },
  {
    id: 4,
    name: "employee",
    description: "Regular employee who can submit requests",
    permissions: ["create_request", "read_own"],
  },
];

let permissions = [
  {
    id: 1,
    name: "create_all",
    description: "Create any resource",
    resource: "all",
  },
  {
    id: 2,
    name: "read_all",
    description: "Read any resource",
    resource: "all",
  },
  {
    id: 3,
    name: "update_all",
    description: "Update any resource",
    resource: "all",
  },
  {
    id: 4,
    name: "delete_all",
    description: "Delete any resource",
    resource: "all",
  },
  {
    id: 5,
    name: "create_request",
    description: "Create leave request",
    resource: "request",
  },
  {
    id: 6,
    name: "read_own",
    description: "Read own requests",
    resource: "request",
  },
  {
    id: 7,
    name: "update_task",
    description: "Update task status",
    resource: "task",
  },
  {
    id: 8,
    name: "create_task",
    description: "Create new tasks",
    resource: "task",
  },
];

let users = [
  {
    id: 1,
    username: "admin",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
  {
    id: 2,
    username: "manager",
    name: "John Manager",
    email: "john.manager@example.com",
    role: "manager",
  },
  {
    id: 3,
    username: "hr",
    name: "Jane HR",
    email: "jane.hr@example.com",
    role: "hr",
  },
  {
    id: 4,
    username: "employee",
    name: "Employee User",
    email: "employee@example.com",
    role: "employee",
  },
];

// Get all roles
router.get("/roles", (req, res) => {
  res.json(roles);
});

// Get a specific role
router.get("/roles/:id", (req, res) => {
  const role = roles.find((r) => r.id === parseInt(req.params.id));
  if (!role) return res.status(404).json({ message: "Role not found" });
  res.json(role);
});

// Create a new role
router.post("/roles", (req, res) => {
  const { name, description, permissions } = req.body;
  const newId = roles.length > 0 ? Math.max(...roles.map((r) => r.id)) + 1 : 1;

  const newRole = {
    id: newId,
    name,
    description,
    permissions: permissions || [],
  };

  roles.push(newRole);
  res.status(201).json(newRole);
});

// Update a role
router.put("/roles/:id", async (req, res) => {
  const roleId = parseInt(req.params.id);
  const roleIndex = roles.findIndex((r) => r.id === roleId);

  if (roleIndex === -1)
    return res.status(404).json({ message: "Role not found" });

  const { name, description, permissions } = req.body;
  const currentRole = roles[roleIndex];
  const oldPermissions = currentRole.permissions || [];
  
  const updatedRole = {
    id: roleId,
    name: name || currentRole.name,
    description: description || currentRole.description,
    permissions: permissions || currentRole.permissions,
  };

  roles[roleIndex] = updatedRole;
  
  // If permissions have changed, notify affected users
  if (permissions && JSON.stringify(permissions) !== JSON.stringify(oldPermissions)) {
    // Find users with this role
    const affectedUsers = users.filter(user => user.role === updatedRole.name);
    
    // Determine added and removed permissions
    const addedPermissions = permissions.filter(p => !oldPermissions.includes(p));
    const removedPermissions = oldPermissions.filter(p => !permissions.includes(p));
    const changedPermissions = [...addedPermissions, ...removedPermissions];
    
    if (changedPermissions.length > 0 && affectedUsers.length > 0) {
      // Send notifications to all affected users
      const notificationPromises = affectedUsers.map(user => {
        const action = `Role permissions updated for ${updatedRole.name}`;
        return sendPermissionChangeNotification(user, changedPermissions, action);
      });
      
      try {
        const results = await Promise.allSettled(notificationPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        res.json({
          role: updatedRole,
          message: `Role updated successfully. Notification emails sent to ${successCount} of ${affectedUsers.length} affected users.`,
          emailPreviewUrls: results
            .filter(r => r.status === 'fulfilled' && r.value.success)
            .map(r => r.value.previewUrl)
        });
      } catch (error) {
        console.error("Error sending permission change emails:", error);
        res.json({
          role: updatedRole,
          message: "Role updated successfully, but failed to send all notification emails."
        });
      }
    } else {
      res.json(updatedRole);
    }
  } else {
    res.json(updatedRole);
  }
});

// Delete a role
router.delete("/roles/:id", (req, res) => {
  const roleId = parseInt(req.params.id);
  const roleIndex = roles.findIndex((r) => r.id === roleId);

  if (roleIndex === -1)
    return res.status(404).json({ message: "Role not found" });

  roles = roles.filter((r) => r.id !== roleId);
  res.json({ message: "Role deleted successfully" });
});

// Get all permissions
router.get("/permissions", (req, res) => {
  res.json(permissions);
});

// Get a specific permission
router.get("/permissions/:id", (req, res) => {
  const permission = permissions.find((p) => p.id === parseInt(req.params.id));
  if (!permission)
    return res.status(404).json({ message: "Permission not found" });
  res.json(permission);
});

// Create a new permission
router.post("/permissions", (req, res) => {
  const { name, description, resource } = req.body;
  const newId =
    permissions.length > 0 ? Math.max(...permissions.map((p) => p.id)) + 1 : 1;

  const newPermission = {
    id: newId,
    name,
    description,
    resource,
  };

  permissions.push(newPermission);
  res.status(201).json(newPermission);
});

// Update a permission
router.put("/permissions/:id", (req, res) => {
  const permissionId = parseInt(req.params.id);
  const permissionIndex = permissions.findIndex((p) => p.id === permissionId);

  if (permissionIndex === -1)
    return res.status(404).json({ message: "Permission not found" });

  const { name, description, resource } = req.body;

  permissions[permissionIndex] = {
    id: permissionId,
    name: name || permissions[permissionIndex].name,
    description: description || permissions[permissionIndex].description,
    resource: resource || permissions[permissionIndex].resource,
  };

  res.json(permissions[permissionIndex]);
});

// Delete a permission
router.delete("/permissions/:id", (req, res) => {
  const permissionId = parseInt(req.params.id);
  const permissionIndex = permissions.findIndex((p) => p.id === permissionId);

  if (permissionIndex === -1)
    return res.status(404).json({ message: "Permission not found" });

  permissions = permissions.filter((p) => p.id !== permissionId);
  res.json({ message: "Permission deleted successfully" });
});

// Get all users
router.get("/users", (req, res) => {
  res.json(users);
});

// Get a specific user
router.get("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// Create a new user
router.post("/users", async (req, res) => {
  const { username, name, email, role } = req.body;
  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  
  // Generate a temporary password
  const tempPassword = Math.random().toString(36).slice(-8);

  const newUser = {
    id: newId,
    username,
    name,
    email,
    role,
  };

  users.push(newUser);
  
  // Send email notification to the new user with their temporary password
  try {
    const emailResult = await sendNewUserNotification(newUser, tempPassword);
    if (emailResult.success) {
      console.log(`Welcome email sent to ${email} with preview URL: ${emailResult.previewUrl}`);
      res.status(201).json({ 
        user: newUser, 
        message: "User created successfully. A welcome email has been sent with login instructions.",
        emailPreviewUrl: emailResult.previewUrl // Only for development
      });
    } else {
      res.status(201).json({ 
        user: newUser, 
        message: "User created successfully, but failed to send welcome email."
      });
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(201).json({ 
      user: newUser, 
      message: "User created successfully, but failed to send welcome email."
    });
  }
});

// Update a user
router.put("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1)
    return res.status(404).json({ message: "User not found" });

  const { username, name, email, role } = req.body;
  const currentUser = users[userIndex];
  const oldRole = currentUser.role;
  
  const updatedUser = {
    id: userId,
    username: username || currentUser.username,
    name: name || currentUser.name,
    email: email || currentUser.email,
    role: role || currentUser.role,
  };

  users[userIndex] = updatedUser;
  
  // If the role has changed, send a notification
  if (role && role !== oldRole) {
    try {
      const emailResult = await sendRoleChangeNotification(updatedUser, oldRole, role);
      if (emailResult.success) {
        console.log(`Role change email sent to ${updatedUser.email} with preview URL: ${emailResult.previewUrl}`);
        res.json({ 
          user: updatedUser, 
          message: "User updated successfully. A notification email has been sent.",
          emailPreviewUrl: emailResult.previewUrl // Only for development
        });
      } else {
        res.json({ 
          user: updatedUser, 
          message: "User updated successfully, but failed to send notification email."
        });
      }
    } catch (error) {
      console.error("Error sending role change email:", error);
      res.json({ 
        user: updatedUser, 
        message: "User updated successfully, but failed to send notification email."
      });
    }
  } else {
    res.json(updatedUser);
  }
});

// Delete a user
router.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1)
    return res.status(404).json({ message: "User not found" });

  users = users.filter((u) => u.id !== userId);
  res.json({ message: "User deleted successfully" });
});

module.exports = router;
