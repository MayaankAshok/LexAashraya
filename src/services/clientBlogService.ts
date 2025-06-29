import type { BlogPostProps } from '../types';
import { 
  loadBlogPosts, 
  getBlogPostById, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost, 
  getAllTags,
  searchBlogPostsWithScoring,
  filterPostsByTags
} from './blogService';

/**
 * Client-side blog service that reads directly from data/posts
 * This replaces BlogApiService for static hosting
 */
export class ClientBlogService {
  /**
   * Get all blog posts with optional search/filter
   */
  static async getAllPosts(
    query?: string, 
    tags?: string[], 
    mode: 'all' | 'tag' | 'keyword' | 'combined' = 'all'
  ): Promise<{ posts: BlogPostProps[]; searchInfo: any }> {
    try {
      let posts: BlogPostProps[] = [];

      if (mode === 'all' || (!query && (!tags || tags.length === 0))) {
        // Load all posts ordered by date
        posts = await loadBlogPosts();
      } else if (mode === 'tag' && tags && tags.length > 0 && !query) {
        // Tag-only filtering
        posts = await filterPostsByTags(tags);
      } else if (mode === 'keyword' && query && (!tags || tags.length === 0)) {
        // Text search only
        posts = await searchBlogPostsWithScoring(query, []);
      } else if (mode === 'combined' && query && tags && tags.length > 0) {
        // Combined text + tag search
        posts = await searchBlogPostsWithScoring(query, tags);
      } else {
        // Fallback to all posts
        posts = await loadBlogPosts();
      }

      return {
        posts,
        searchInfo: {
          mode,
          query: query || '',
          tags: tags || []
        }
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
      const post = await getBlogPostById(id);
      
      if (!post) {
        throw new Error('Post not found');
      }

      return post;
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
      // Generate ID if not provided
      const id = postData.id || postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newPost: BlogPostProps = {
        ...postData,
        id,
        date: postData.date || new Date().toISOString().split('T')[0]
      };

      const success = await createBlogPost(newPost);
      
      if (!success) {
        throw new Error('Failed to create post');
      }

      return newPost;
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
      const success = await updateBlogPost(id, postData);
      
      if (!success) {
        throw new Error('Failed to update post');
      }

      return postData;
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
      const success = await deleteBlogPost(id);
      
      if (!success) {
        throw new Error('Failed to delete post');
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
      return await getAllTags();
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
   * Health check - always returns true for client-side operation
   */
  static async healthCheck(): Promise<boolean> {
    return true;
  }
}
