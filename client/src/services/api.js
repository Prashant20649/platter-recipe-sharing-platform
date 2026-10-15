const BASE_URL = '';

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    credentials: 'include' // Needed for httpOnly JWT cookie
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      error.maintenance = data.maintenance || false;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => apiRequest('/api/auth/me'),

  // Settings
  getSettings: () => apiRequest('/api/settings'),
  getAdminSettings: () => apiRequest('/api/settings/admin'),
  updateSettings: (settings) =>
    apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Users
  getUsers: () => apiRequest('/api/users'),
  createUser: (userData) =>
    apiRequest('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, userData) =>
    apiRequest(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id) => apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
  updateProfile: (profileData) =>
    apiRequest('/api/users/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  toggleFavorite: (recipeId) =>
    apiRequest(`/api/users/favorites/${recipeId}`, { method: 'POST' }),
  getFavorites: () => apiRequest('/api/users/favorites'),

  // Recipes
  getRecipes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/recipes${query ? `?${query}` : ''}`);
  },
  getMyRecipes: () => apiRequest('/api/recipes/my'),
  getAdminRecipes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/recipes/admin/all${query ? `?${query}` : ''}`);
  },
  getRecipeById: (id) => apiRequest(`/api/recipes/${id}`),
  createRecipe: (formData) =>
    apiRequest('/api/recipes', { method: 'POST', body: formData }),
  updateRecipe: (id, formData) =>
    apiRequest(`/api/recipes/${id}`, { method: 'PUT', body: formData }),
  deleteRecipe: (id) => apiRequest(`/api/recipes/${id}`, { method: 'DELETE' }),
  updateRecipeApproval: (id, status) =>
    apiRequest(`/api/recipes/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Reviews
  getRecipeReviews: (recipeId) => apiRequest(`/api/reviews/recipe/${recipeId}`),
  getMyReviews: () => apiRequest('/api/reviews/my'),
  getAllReviewsAdmin: () => apiRequest('/api/reviews/admin/all'),
  addReview: (recipeId, reviewData) =>
    apiRequest(`/api/reviews/recipe/${recipeId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    }),
  updateReview: (id, reviewData) =>
    apiRequest(`/api/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    }),
  deleteReview: (id) => apiRequest(`/api/reviews/${id}`, { method: 'DELETE' }),

  // Collections
  getCollections: () => apiRequest('/api/collections'),
  createCollection: (data) =>
    apiRequest('/api/collections', { method: 'POST', body: JSON.stringify(data) }),
  updateCollection: (id, data) =>
    apiRequest(`/api/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCollection: (id) => apiRequest(`/api/collections/${id}`, { method: 'DELETE' }),
  addRecipeToCollection: (collectionId, recipeId) =>
    apiRequest(`/api/collections/${collectionId}/recipes/${recipeId}`, { method: 'POST' }),
  removeRecipeFromCollection: (collectionId, recipeId) =>
    apiRequest(`/api/collections/${collectionId}/recipes/${recipeId}`, { method: 'DELETE' }),

  // Messages
  getMessages: () => apiRequest('/api/messages'),
  sendMessage: (messageData) =>
    apiRequest('/api/messages', { method: 'POST', body: JSON.stringify(messageData) }),
  markMessageRead: (id) => apiRequest(`/api/messages/${id}/read`, { method: 'PATCH' }),

  // History
  getHistory: () => apiRequest('/api/history'),
  removeHistoryItem: (id) => apiRequest(`/api/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => apiRequest('/api/history', { method: 'DELETE' }),

  // Stats
  getContributorStats: () => apiRequest('/api/stats/contributor'),
  getAdminStats: () => apiRequest('/api/stats/admin')
};
