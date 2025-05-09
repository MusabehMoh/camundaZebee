import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const RBACManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  // Auth context for permission checks
  const { hasPermission } = useAuth();
  
  // Check if user has admin permissions
  useEffect(() => {
    if (!hasPermission('create_all')) {
      setError('You do not have permission to access the RBAC management. Please contact an administrator.');
    }
  }, [hasPermission]);

  // Form states
  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    email: "",
    role: "",
  });
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [],
  });
  const [newPermission, setNewPermission] = useState({
    name: "",
    description: "",
    resource: "",
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState("users");

  // Fetch data when component mounts
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3002/api/rbac/users");
      setUsers(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again later.");
      // Use mock data for development
      setUsers([
        {
          id: 1,
          username: "john.manager",
          name: "John Smith",
          email: "john.manager@example.com",
          role: "manager",
        },
        {
          id: 2,
          username: "jane.hr",
          name: "Jane Wilson",
          email: "jane.hr@example.com",
          role: "hr",
        },
        {
          id: 3,
          username: "admin",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3002/api/rbac/roles");
      setRoles(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setError("Failed to load roles. Please try again later.");
      // Use mock data for development
      setRoles([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:3002/api/rbac/permissions"
      );
      setPermissions(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setError("Failed to load permissions. Please try again later.");
      // Use mock data for development
      setPermissions([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("http://localhost:3002/api/rbac/users", newUser);
      setMessage({ type: "success", text: "User added successfully!" });
      fetchUsers(); // Refresh users list
      setNewUser({ username: "", name: "", email: "", role: "" }); // Reset form
    } catch (error) {
      console.error("Error adding user:", error);
      setMessage({
        type: "error",
        text: "Failed to add user. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add role
  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("http://localhost:3002/api/rbac/roles", newRole);
      setMessage({ type: "success", text: "Role added successfully!" });
      fetchRoles(); // Refresh roles list
      setNewRole({ name: "", description: "", permissions: [] }); // Reset form
    } catch (error) {
      console.error("Error adding role:", error);
      setMessage({
        type: "error",
        text: "Failed to add role. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add permission
  const handleAddPermission = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:3002/api/rbac/permissions",
        newPermission
      );
      setMessage({ type: "success", text: "Permission added successfully!" });
      fetchPermissions(); // Refresh permissions list
      setNewPermission({ name: "", description: "", resource: "" }); // Reset form
    } catch (error) {
      console.error("Error adding permission:", error);
      setMessage({
        type: "error",
        text: "Failed to add permission. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:3002/api/rbac/users/${userId}`);
        setMessage({ type: "success", text: "User deleted successfully!" });
        fetchUsers(); // Refresh users list
      } catch (error) {
        console.error("Error deleting user:", error);
        setMessage({
          type: "error",
          text: "Failed to delete user. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete role
  const handleDeleteRole = async (roleId) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:3002/api/rbac/roles/${roleId}`);
        setMessage({ type: "success", text: "Role deleted successfully!" });
        fetchRoles(); // Refresh roles list
      } catch (error) {
        console.error("Error deleting role:", error);
        setMessage({
          type: "error",
          text: "Failed to delete role. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete permission
  const handleDeletePermission = async (permissionId) => {
    if (window.confirm("Are you sure you want to delete this permission?")) {
      try {
        setLoading(true);
        await axios.delete(
          `http://localhost:3002/api/rbac/permissions/${permissionId}`
        );
        setMessage({
          type: "success",
          text: "Permission deleted successfully!",
        });
        fetchPermissions(); // Refresh permissions list
      } catch (error) {
        console.error("Error deleting permission:", error);
        setMessage({
          type: "error",
          text: "Failed to delete permission. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle permission for a role
  const handleTogglePermission = async (roleId, permissionName) => {
    try {
      setLoading(true);
      const role = roles.find((r) => r.id === roleId);
      const updatedPermissions = [...role.permissions];

      if (updatedPermissions.includes(permissionName)) {
        // Remove permission
        const index = updatedPermissions.indexOf(permissionName);
        updatedPermissions.splice(index, 1);
      } else {
        // Add permission
        updatedPermissions.push(permissionName);
      }

      await axios.put(`http://localhost:3002/api/rbac/roles/${roleId}`, {
        ...role,
        permissions: updatedPermissions,
      });

      setMessage({
        type: "success",
        text: "Role permissions updated successfully!",
      });
      fetchRoles(); // Refresh roles list
    } catch (error) {
      console.error("Error updating role permissions:", error);
      setMessage({
        type: "error",
        text: "Failed to update role permissions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle permission checkbox for new role
  const handlePermissionChange = (permissionName) => {
    const updatedPermissions = [...newRole.permissions];

    if (updatedPermissions.includes(permissionName)) {
      // Remove permission
      const index = updatedPermissions.indexOf(permissionName);
      updatedPermissions.splice(index, 1);
    } else {
      // Add permission
      updatedPermissions.push(permissionName);
    }

    setNewRole({
      ...newRole,
      permissions: updatedPermissions,
    });
  };

  return (
    <div className="rbac-container">
      <h2>Role-Based Access Control Management</h2>

      {message && (
        <div className={`${message.type}-message`}>{message.text}</div>
      )}
      
      {/* Show access denied message if user doesn't have admin permissions */}
      {!hasPermission('create_all') ? (
        <div className="error-message">
          <p>Access Denied: You do not have permission to manage roles and permissions.</p>
          <p>Please contact an administrator for assistance.</p>
        </div>
      ) : (
        <>
          <div className="tabs">
            <button
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              className={activeTab === "roles" ? "active" : ""}
              onClick={() => setActiveTab("roles")}
            >
              Roles
            </button>
            <button
              className={activeTab === "permissions" ? "active" : ""}
              onClick={() => setActiveTab("permissions")}
            >
              Permissions
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="tab-content">
              <h3>Manage Users</h3>

              <form onSubmit={handleAddUser} className="form-panel">
                <h4>Add New User</h4>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={loading} className="button-primary">
                  {loading ? "Adding..." : "Add User"}
                </button>
              </form>

              <div className="data-table">
                <h4>Users List</h4>
                {loading && <p>Loading users...</p>}
                {error && <p className="error-message">{error}</p>}

                {users.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="button-delete"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No users found.</p>
                )}
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === "roles" && (
            <div className="tab-content">
              <h3>Manage Roles</h3>

              <form onSubmit={handleAddRole} className="form-panel">
                <h4>Add New Role</h4>
                <div className="form-group">
                  <label htmlFor="roleName">Role Name</label>
                  <input
                    type="text"
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="roleDescription">Description</label>
                  <input
                    type="text"
                    id="roleDescription"
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Permissions</label>
                  <div className="checkbox-group">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          id={`perm-${permission.id}`}
                          checked={newRole.permissions.includes(permission.name)}
                          onChange={() => handlePermissionChange(permission.name)}
                        />
                        <label htmlFor={`perm-${permission.id}`}>
                          {permission.name} - {permission.description}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading} className="button-primary">
                  {loading ? "Adding..." : "Add Role"}
                </button>
              </form>

              <div className="data-table">
                <h4>Roles List</h4>
                {loading && <p>Loading roles...</p>}
                {error && <p className="error-message">{error}</p>}

                {roles.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Role Name</th>
                        <th>Description</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id}>
                          <td>{role.name}</td>
                          <td>{role.description}</td>
                          <td>
                            <div className="permission-pills">
                              {role.permissions.map((perm) => (
                                <span key={perm} className="permission-pill">
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="button-delete"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No roles found.</p>
                )}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="tab-content">
              <h3>Manage Permissions</h3>

              <form onSubmit={handleAddPermission} className="form-panel">
                <h4>Add New Permission</h4>
                <div className="form-group">
                  <label htmlFor="permName">Permission Name</label>
                  <input
                    type="text"
                    id="permName"
                    value={newPermission.name}
                    onChange={(e) =>
                      setNewPermission({ ...newPermission, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="permDescription">Description</label>
                  <input
                    type="text"
                    id="permDescription"
                    value={newPermission.description}
                    onChange={(e) =>
                      setNewPermission({
                        ...newPermission,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="resource">Resource</label>
                  <input
                    type="text"
                    id="resource"
                    value={newPermission.resource}
                    onChange={(e) =>
                      setNewPermission({
                        ...newPermission,
                        resource: e.target.value,
                      })
                    }
                    required
                  />
                  <small>E.g. 'task', 'request', 'user', 'all'</small>
                </div>

                <button type="submit" disabled={loading} className="button-primary">
                  {loading ? "Adding..." : "Add Permission"}
                </button>
              </form>

              <div className="data-table">
                <h4>Permissions List</h4>
                {loading && <p>Loading permissions...</p>}
                {error && <p className="error-message">{error}</p>}

                {permissions.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Permission Name</th>
                        <th>Description</th>
                        <th>Resource</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission) => (
                        <tr key={permission.id}>
                          <td>{permission.name}</td>
                          <td>{permission.description}</td>
                          <td>{permission.resource}</td>
                          <td>
                            <button
                              onClick={() => handleDeletePermission(permission.id)}
                              className="button-delete"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No permissions found.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RBACManagement;
