// src/services/userService.js (DEBUG VERSION)
import api from '../api/axios';

export const userService = {
  updateUserStatus: (userId, is_active) => {
    console.log('🔄 Calling updateUserStatus:', { userId, is_active });
    console.log('📡 URL:', `/users/admin/${userId}/status`);
    return api.put(`/users/admin/${userId}/status`, { is_active });
  },
  
  updateUserEmail: (userId, email) => {
    console.log('🔄 Calling updateUserEmail:', { userId, email });
    return api.put(`/users/admin/${userId}/email`, { email });
  },
  
  deleteUser: (userId) => {
    console.log('🔄 Calling deleteUser:', { userId });
    return api.delete(`/users/admin/${userId}`);
  },
  
  getUserById: (userId) => {
    console.log('🔄 Calling getUserById:', { userId });
    return api.get(`/users/admin/${userId}`);
  },
  
  getUserLoginSessions: (userId, params = {}) => {
    console.log('🔄 Calling getUserLoginSessions:', { userId, params });
    return api.get(`/users/admin/${userId}/sessions`, { params });
  },

  // ... keep your existing endpoints
};

export default userService;