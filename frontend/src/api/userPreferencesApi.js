// src/api/userPreferencesApi.js
import api from './axios';

const userPreferencesApi = {
  // Toggle watchlist
  toggleWatchlist: async (contentId, action) => {
    try {
      const response = await api.post('/user/watchlist', {
        contentId,
        action
      });
      return response.data;
    } catch (error) {
      console.error('Watchlist API error:', error);
      throw error;
    }
  },

  // Toggle like
  toggleLike: async (contentId, action) => {
    try {
      const response = await api.post('/user/likes', {
        contentId,
        action
      });
      return response.data;
    } catch (error) {
      console.error('Like API error:', error);
      throw error;
    }
  },

  // Get user preferences for specific content
  getUserContentPreferences: async (contentId) => {
    try {
      const response = await api.get(`/user/preferences/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('Preferences API error:', error);
      throw error;
    }
  },

  // Batch get user preferences for multiple contents
  getBatchUserPreferences: async (contentIds) => {
    try {
      const response = await api.post('/user/preferences/batch', {
        contentIds
      });
      return response.data;
    } catch (error) {
      console.error('Batch preferences API error:', error);
      throw error;
    }
  }
};

export default userPreferencesApi;