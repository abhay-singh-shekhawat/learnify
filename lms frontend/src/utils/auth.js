export const saveToken = (token) => {
  if (!token) return;
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUserRole = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const decoded = JSON.parse(jsonPayload);

    // Adjust based on your JWT payload (usually "role" or "Role")
    return decoded.role || decoded.Role || null;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};