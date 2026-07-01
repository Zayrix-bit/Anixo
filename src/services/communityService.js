import { backendApi } from './api';

// ==================== POSTS ====================

export async function getCommunityPosts({ page = 1, limit = 20, category, sort = 'newest', search } = {}) {
  try {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    params.set('sort', sort);
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);

    const res = await backendApi.get(`/community/posts?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.error("Get community posts error:", error.response?.data || error.message);
    return { success: false, posts: [], pagination: {} };
  }
}

export async function getCommunityPost(postId) {
  try {
    const res = await backendApi.get(`/community/posts/${postId}`);
    return res.data;
  } catch (error) {
    console.error("Get community post error:", error.response?.data || error.message);
    return { success: false };
  }
}

export async function createCommunityPost({ title, content, category, tags }) {
  try {
    const res = await backendApi.post('/community/posts', { title, content, category, tags });
    return res.data;
  } catch (error) {
    console.error("Create community post error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Error creating post' };
  }
}

export async function updateCommunityPost(postId, { title, content, category, tags }) {
  try {
    const res = await backendApi.put(`/community/posts/${postId}`, { title, content, category, tags });
    return res.data;
  } catch (error) {
    console.error("Update community post error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Error updating post' };
  }
}

export async function deleteCommunityPost(postId) {
  try {
    const res = await backendApi.delete(`/community/posts/${postId}`);
    return res.data;
  } catch (error) {
    console.error("Delete community post error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Error deleting post' };
  }
}

export async function likeCommunityPost(postId) {
  try {
    const res = await backendApi.post(`/community/posts/${postId}/like`);
    return res.data;
  } catch (error) {
    console.error("Like community post error:", error.response?.data || error.message);
    return { success: false };
  }
}

export async function dislikeCommunityPost(postId) {
  try {
    const res = await backendApi.post(`/community/posts/${postId}/dislike`);
    return res.data;
  } catch (error) {
    console.error("Dislike community post error:", error.response?.data || error.message);
    return { success: false };
  }
}

export async function pinCommunityPost(postId) {
  try {
    const res = await backendApi.post(`/community/posts/${postId}/pin`);
    return res.data;
  } catch (error) {
    console.error("Pin community post error:", error.response?.data || error.message);
    return { success: false };
  }
}

export async function lockCommunityPost(postId) {
  try {
    const res = await backendApi.post(`/community/posts/${postId}/lock`);
    return res.data;
  } catch (error) {
    console.error("Lock community post error:", error.response?.data || error.message);
    return { success: false };
  }
}

// ==================== COMMENTS ====================

export async function getPostComments(postId) {
  try {
    const res = await backendApi.get(`/community/posts/${postId}/comments`);
    return res.data;
  } catch (error) {
    console.error("Get post comments error:", error.response?.data || error.message);
    return { success: false, comments: [] };
  }
}

export async function addPostComment(postId, { content, parentId }) {
  try {
    const res = await backendApi.post(`/community/posts/${postId}/comments`, { content, parentId });
    return res.data;
  } catch (error) {
    console.error("Add post comment error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Error adding comment' };
  }
}

export async function likePostComment(commentId) {
  try {
    const res = await backendApi.post(`/community/comments/${commentId}/like`);
    return res.data;
  } catch (error) {
    console.error("Like comment error:", error.response?.data || error.message);
    return { success: false };
  }
}

export async function deletePostComment(commentId) {
  try {
    const res = await backendApi.delete(`/community/comments/${commentId}`);
    return res.data;
  } catch (error) {
    console.error("Delete comment error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Error deleting comment' };
  }
}
