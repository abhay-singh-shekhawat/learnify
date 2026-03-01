// src/utils/auth.js

export const saveToken = (token) => {
  if (!token) return;
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole'); // also clean up role
};

export const saveUserRole = (role) => {
  if (role) {
    localStorage.setItem('userRole', role);
  }
};

export const getUserRole = () => {
  // First try to read from saved storage (fast)
  const savedRole = localStorage.getItem('userRole');
  if (savedRole) return savedRole;

  // Fallback: decode from token if no saved role
  const token = getToken();
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const decoded = JSON.parse(jsonPayload);

    const role = decoded.role || decoded.Role || null;
    if (role) {
      saveUserRole(role); // cache it for next time
    }
    return role;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};