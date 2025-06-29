import type { BlogPostProps } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export class BlogApiService {
  /**
   * Get all blog posts with optional search/filter
   */
  static async getAllPosts(
    query?: string, 
    tags?: string[], 
    mode: 'all' | 'tag' | 'keyword' | 'combined' = 'all'
  ): Promise<{ posts: BlogPostProps[]; searchInfo: any }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (query) searchParams.append('query', query);
      if (tags && tags.length > 0) {
        tags.forEach(tag => searchParams.append('tags', tag));
      }
      if (mode !== 'all') searchParams.append('mode', mode);

      const response = await fetch(`${API_BASE_URL}/posts?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      return {
        posts: data.posts,
        searchInfo: data.searchInfo
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Get a single blog post by ID
   */
  static async getPostById(id: string): Promise<BlogPostProps> {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error('Failed to fetch post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Create a new blog post
   */
  static async createPost(postData: Omit<BlogPostProps, 'id'> & { id?: string }): Promise<BlogPostProps> {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create post' }));
        throw new Error(errorData.error || 'Failed to create post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Update an existing blog post
   */
  static async updatePost(id: string, postData: BlogPostProps): Promise<BlogPostProps> {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update post' }));
        throw new Error(errorData.error || 'Failed to update post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Delete a blog post
   */
  static async deletePost(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete post' }));
        throw new Error(errorData.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Get all unique tags
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tags`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  /**
   * Search posts by various criteria
   */
  static async searchPosts(
    searchTerm?: string,
    selectedTags?: string[],
    searchMode: 'all' | 'tag' | 'keyword' | 'combined' = 'all'
  ): Promise<{ posts: BlogPostProps[]; searchInfo: any }> {
    return this.getAllPosts(searchTerm, selectedTags, searchMode);
  }

  /**
   * Health check for the server
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
