// Service factory to switch between client and server services based on build mode
import { BlogApiService } from './blogApiService';
import { ClientBlogService } from './clientBlogService';
import type { BlogPostProps } from '../types';

// Declare global build-time constants
declare const __BUILD_MODE__: string;
declare const __ADMIN_ENABLED__: boolean;

// Check if we're in admin mode
const isAdminMode = () => {
  return __ADMIN_ENABLED__ || import.meta.env.VITE_ADMIN_ENABLED === 'true';
};

export class BlogServiceFactory {  /**
   * Get all blog posts with optional search/filter
   * Always uses static client service for consistent static functionality
   */
  static async getAllPosts(
    query?: string, 
    tags?: string[], 
    mode: 'all' | 'tag' | 'keyword' | 'combined' = 'all'
  ): Promise<{ posts: BlogPostProps[]; searchInfo: any }> {
    // Always use client service for reading posts to maintain static functionality
    return ClientBlogService.getAllPosts(query, tags, mode);
  }

  /**
   * Get a single blog post by ID
   * Always uses static client service for consistent static functionality
   */
  static async getPostById(id: string): Promise<BlogPostProps> {
    // Always use client service for reading posts to maintain static functionality
    return ClientBlogService.getPostById(id);
  }

  /**
   * Create a new blog post (only available in admin mode)
   */
  static async createPost(postData: Omit<BlogPostProps, 'id'> & { id?: string }): Promise<BlogPostProps> {
    if (isAdminMode()) {
      return BlogApiService.createPost(postData);
    } else {
      throw new Error('Post creation is not available in static mode');
    }
  }

  /**
   * Update an existing blog post (only available in admin mode)
   */
  static async updatePost(id: string, postData: BlogPostProps): Promise<BlogPostProps> {
    if (isAdminMode()) {
      return BlogApiService.updatePost(id, postData);
    } else {
      throw new Error('Post updates are not available in static mode');
    }
  }

  /**
   * Delete a blog post (only available in admin mode)
   */
  static async deletePost(id: string): Promise<void> {
    if (isAdminMode()) {
      return BlogApiService.deletePost(id);
    } else {
      throw new Error('Post deletion is not available in static mode');
    }
  }
  /**
   * Get all unique tags
   * Always uses static client service for consistent static functionality
   */
  static async getAllTags(): Promise<string[]> {
    // Always use client service for reading tags to maintain static functionality
    return ClientBlogService.getAllTags();
  }

  /**
   * Search posts by various criteria
   * Always uses static client service for consistent static functionality
   */
  static async searchPosts(
    searchTerm?: string,
    selectedTags?: string[],
    searchMode: 'all' | 'tag' | 'keyword' | 'combined' = 'all'
  ): Promise<{ posts: BlogPostProps[]; searchInfo: any }> {
    // Always use static functionality for search
    return this.getAllPosts(searchTerm, selectedTags, searchMode);
  }

  /**
   * Health check
   * For admin mode, checks server connectivity for write operations
   * For static mode, always returns true
   */
  static async healthCheck(): Promise<boolean> {
    if (isAdminMode()) {
      try {
        // Check server connectivity for admin operations
        const response = await fetch(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001');
        return response.ok;
      } catch {
        return false;
      }
    } else {
      // Static mode always has posts available
      return ClientBlogService.healthCheck();
    }
  }

  /**
   * Check if admin features are enabled
   */
  static isAdminEnabled(): boolean {
    return isAdminMode();
  }

  /**
   * Get current build mode
   */
  static getBuildMode(): string {
    return __BUILD_MODE__ || import.meta.env.VITE_BUILD_MODE || 'static';
  }
}
