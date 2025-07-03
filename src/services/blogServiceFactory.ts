// Service factory to switch between client and server services based on build mode
import { BlogApiService } from './blogApiService';
import { ClientBlogService } from './clientBlogService';
import type { BlogPostProps } from '../types';

// Declare global build-time constants
declare const __BUILD_MODE__: string;
declare const __ADMIN_ENABLED__: boolean;

// Check if we're in admin mode (for UI display purposes)
const isAdminMode = () => {
  return __ADMIN_ENABLED__ || 
         import.meta.env.VITE_ADMIN_ENABLED === 'true' ||
         __BUILD_MODE__ === 'admin';
};

// Check if admin functionality should be available (always true now)
const isAdminFunctionalityEnabled = () => {
  return true; // Admin functionality is always available
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
   * Create a new blog post (always available now)
   */
  static async createPost(postData: Omit<BlogPostProps, 'id'> & { id?: string }): Promise<BlogPostProps> {
    if (isAdminFunctionalityEnabled()) {
      return BlogApiService.createPost(postData);
    } else {
      throw new Error('Post creation is not available in static mode');
    }
  }

  /**
   * Update an existing blog post (always available now)
   */
  static async updatePost(id: string, postData: BlogPostProps): Promise<BlogPostProps> {
    if (isAdminFunctionalityEnabled()) {
      return BlogApiService.updatePost(id, postData);
    } else {
      throw new Error('Post updates are not available in static mode');
    }
  }

  /**
   * Delete a blog post (always available now)
   */
  static async deletePost(id: string): Promise<void> {
    if (isAdminFunctionalityEnabled()) {
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
   * Always checks server connectivity now
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Check server connectivity for admin operations
      const response = await fetch(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001');
      return response.ok;
    } catch {
      // Fallback to client service if server is not available
      return ClientBlogService.healthCheck();
    }
  }

  /**
   * Check if admin features are enabled (for UI display)
   */
  static isAdminEnabled(): boolean {
    return isAdminMode();
  }

  /**
   * Check if admin functionality is available (always true)
   */
  static isAdminFunctionalityAvailable(): boolean {
    return isAdminFunctionalityEnabled();
  }

  /**
   * Check if admin UI should be shown
   */
  static shouldShowAdminUI(): boolean {
    return isAdminMode();
  }

  /**
   * Get current build mode
   */
  static getBuildMode(): string {
    return __BUILD_MODE__ || import.meta.env.VITE_BUILD_MODE || 'static';
  }
}
