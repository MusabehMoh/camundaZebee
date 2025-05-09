import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// Export a hook for using the context
export function useAuth() {
  return useContext(AuthContext);
}

// Create the provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenExpiration, setTokenExpiration] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  
  // Configuration
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  const WARNING_BEFORE_TIMEOUT = 2 * 60 * 1000; // 2 minutes before expiration
  
  // Mock roles and permissions for development
  const mockRolesPermissions = {
    'admin': ['create_all', 'read_all', 'update_all', 'delete_all'],
    'manager': ['read_all', 'update_task', 'create_task'],
    'hr': ['read_all', 'update_task'],
    'employee': ['create_request', 'read_own']
  };
  // Function to login a user
  const login = async (username, password) => {
    try {
      // In a real application, you would make an API call to authenticate
      // const response = await axios.post('http://localhost:3002/api/auth/login', { username, password });
      // setCurrentUser(response.data.user);
      // setUserRole(response.data.role);
      // setUserPermissions(response.data.permissions);
      
      // Mock login for development
      let loginResult = { success: false, message: 'Invalid username or password' };
      
      if (username === 'admin' && password === 'admin') {
        const user = { id: 1, username: 'admin', name: 'Admin User', email: 'admin@example.com' };
        const role = 'admin';
        loginResult = await setupUserSession(user, role);
      } else if (username === 'manager' && password === 'manager') {
        const user = { id: 2, username: 'manager', name: 'John Manager', email: 'john.manager@example.com' };
        const role = 'manager';
        loginResult = await setupUserSession(user, role);
      } else if (username === 'hr' && password === 'hr') {
        const user = { id: 3, username: 'hr', name: 'Jane HR', email: 'jane.hr@example.com' };
        const role = 'hr';
        loginResult = await setupUserSession(user, role);
      } else if (username === 'employee' && password === 'employee') {
        const user = { id: 4, username: 'employee', name: 'Employee User', email: 'employee@example.com' };
        const role = 'employee';
        loginResult = await setupUserSession(user, role);
      }
      
      return loginResult;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };
  
  // Helper function to setup user session with expiration
  const setupUserSession = async (user, role) => {
    try {
      // Set user data in state
      setCurrentUser(user);
      setUserRole(role);
      setUserPermissions(mockRolesPermissions[role]);
      
      // Calculate expiration time
      const expirationTime = new Date().getTime() + SESSION_DURATION;
      setTokenExpiration(expirationTime);
      
      // Store in localStorage with expiration
      const sessionData = {
        user,
        role,
        expiration: expirationTime
      };
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
      
      // Set up session timeout
      setupSessionTimeout(expirationTime);
      
      return { success: true };
    } catch (error) {
      console.error('Error setting up session:', error);
      return { success: false, message: 'Failed to set up user session.' };
    }
  };
  
  // Set up the session timeout timer
  const setupSessionTimeout = (expirationTime) => {
    // Clear any existing timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    // Calculate time until expiration
    const timeUntilExpiration = expirationTime - new Date().getTime();
    
    // Set timeout to automatically logout when session expires
    if (timeUntilExpiration > 0) {
      // Set timeout for warning
      const warningTime = timeUntilExpiration - WARNING_BEFORE_TIMEOUT;
      
      if (warningTime > 0) {
        setTimeout(() => {
          alert('Your session will expire in 2 minutes. Please save your work.');
        }, warningTime);
      }
      
      // Set timeout for logout
      const newTimeout = setTimeout(() => {
        alert('Your session has expired. You will be logged out.');
        logout();
      }, timeUntilExpiration);
      
      setSessionTimeout(newTimeout);
    } else {
      // Session has already expired
      logout();
    }
  };
  // Function to logout a user
  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setUserPermissions([]);
    setTokenExpiration(null);
    
    // Clear session timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    
    // Clear storage
    localStorage.removeItem('sessionData');
  };
  
  // Function to refresh/extend the session
  const refreshSession = () => {
    if (currentUser && userRole) {
      // Calculate new expiration time
      const expirationTime = new Date().getTime() + SESSION_DURATION;
      setTokenExpiration(expirationTime);
      
      // Update localStorage
      const sessionData = {
        user: currentUser,
        role: userRole,
        expiration: expirationTime
      };
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
      
      // Reset timeout
      setupSessionTimeout(expirationTime);
      
      return true;
    }
    return false;
  };
  // Check if user has a specific permission
  const hasPermission = (permission) => {
    return userPermissions.includes(permission);
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return userRole === role;
  };
  
  // Check if the session is still valid
  const isSessionValid = () => {
    if (!tokenExpiration) return false;
    return new Date().getTime() < tokenExpiration;
  };

  // Check for saved user on component mount (initialize from localStorage)
  useEffect(() => {
    const initializeAuthFromLocalStorage = () => {
      try {
        const savedSession = localStorage.getItem('sessionData');
        
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          const { user, role, expiration } = parsedSession;
          
          // Check if session is still valid
          if (expiration && new Date().getTime() < expiration) {
            setCurrentUser(user);
            setUserRole(role);
            setUserPermissions(mockRolesPermissions[role] || []);
            setTokenExpiration(expiration);
            
            // Setup timeout for the remaining session duration
            setupSessionTimeout(expiration);
          } else {
            // Session expired, clean up
            localStorage.removeItem('sessionData');
          }
        } else {
          // Check for old format storage and migrate if needed
          const savedUser = localStorage.getItem('user');
          const savedRole = localStorage.getItem('role');
          
          if (savedUser && savedRole) {
            // Migrate to new format
            const user = JSON.parse(savedUser);
            const role = savedRole;
            
            // Set up new session
            setupUserSession(user, role);
            
            // Remove old format
            localStorage.removeItem('user');
            localStorage.removeItem('role');
          }
        }
      } catch (error) {
        console.error('Error initializing auth from localStorage:', error);
        localStorage.removeItem('sessionData');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuthFromLocalStorage();
    
    // Clean up session timeout on unmount
    return () => {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, []);

  // Activity monitor to refresh session
  useEffect(() => {
    if (!currentUser) return;
    
    const refreshOnActivity = () => {
      // Only refresh if we're logged in and session is valid
      if (currentUser && isSessionValid()) {
        refreshSession();
      }
    };
    
    // Add event listeners for user activity
    window.addEventListener('click', refreshOnActivity);
    window.addEventListener('keypress', refreshOnActivity);
    window.addEventListener('scroll', refreshOnActivity);
    window.addEventListener('mousemove', refreshOnActivity);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('click', refreshOnActivity);
      window.removeEventListener('keypress', refreshOnActivity);
      window.removeEventListener('scroll', refreshOnActivity);
      window.removeEventListener('mousemove', refreshOnActivity);
    };
  }, [currentUser, tokenExpiration]);

  // Create the value object for the context
  const value = {
    currentUser,
    userRole,
    userPermissions,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    refreshSession,
    isSessionValid,
    tokenExpiration
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
