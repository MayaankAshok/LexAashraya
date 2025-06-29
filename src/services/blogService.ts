import type { BlogPostProps } from '../types';

// This service will handle loading blog posts from the posts directory
export async function loadBlogPosts(): Promise<BlogPostProps[]> {
  try {
    // For static builds, load posts dynamically from the /data/posts/ directory
    const posts: BlogPostProps[] = [];
    
    try {
      // Try to load the posts manifest file
      const manifestResponse = await fetch('/data/posts-manifest.json');
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        const postIds = manifest.posts || [];
        
        // Load each post file dynamically
        for (const postId of postIds) {
          try {
            const response = await fetch(`/data/posts/${postId}.json`);
            if (response.ok) {
              const post = await response.json();
              posts.push({
                id: post.id,
                title: post.title,
                date: post.date,
                author: post.author,
                summary: post.summary,
                content: post.content,
                image: post.image,
                tags: post.tags || [],
                citation: post.citation,
                jurisdiction: post.jurisdiction,
                attachments: post.attachments || []
              });
            }
          } catch (err) {
            console.warn(`Failed to load post ${postId}:`, err);
          }
        }
      } else {
        // Fallback: try known post IDs if manifest doesn't exist
        const knownPostIds = [
          'dpa-2025',
          'smith-v-tech-giant',
          'remote-work-regulations',
          'sad-sad-3',
          'hewyyyy-corporate-compliance-the-environmental-protection-directive'
        ];
        
        for (const postId of knownPostIds) {
          try {
            const response = await fetch(`/data/posts/${postId}.json`);
            if (response.ok) {
              const post = await response.json();
              posts.push({
                id: post.id,
                title: post.title,
                date: post.date,
                author: post.author,
                summary: post.summary,
                content: post.content,
                image: post.image,
                tags: post.tags || [],
                citation: post.citation,
                jurisdiction: post.jurisdiction,
                attachments: post.attachments || []
              });
            }
          } catch (err) {
            console.warn(`Failed to load post ${postId}:`, err);
          }
        }
      }
    } catch (manifestError) {
      console.warn('Failed to load posts manifest, using fallback method:', manifestError);
    }
    
    // Sort posts by date (newest first)
    return posts.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

// Function to get a single post by ID
export async function getBlogPostById(id: string | number): Promise<BlogPostProps | undefined> {
  const posts = await loadBlogPosts();
  // All post IDs should be strings
  const postId = id.toString();
  return posts.find(post => post.id === postId);
}

// Function to calculate text similarity between query and content
function calculateTextSimilarity(query: string, text: string): number {
  if (!query || !text) return 0;
  
  // Convert to lowercase for case-insensitive matching
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Split into words for better matching
  const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 2);
  
  if (queryWords.length === 0) return 0;
  
  // Direct match has the highest score
  if (lowerText.includes(lowerQuery)) {
    return 1.0;
  }
  
  // Calculate how many of the query words are found in the text
  let matchedWords = 0;
  let partialMatches = 0;
  
  for (const word of queryWords) {
    if (lowerText.includes(word)) {
      matchedWords++;
    } else {
      // Check for partial matches (at least 3 characters)
      if (word.length >= 3) {
        for (let i = 0; i < word.length - 2; i++) {
          const substring = word.substring(i, i + 3);
          if (lowerText.includes(substring)) {
            partialMatches += 0.3; // Partial match gives less score
            break;
          }
        }
      }
    }
  }
  
  // Calculate score based on ratio of matched words to total words
  const exactMatchScore = matchedWords / queryWords.length;
  const partialMatchScore = partialMatches / queryWords.length;
  
  // Combine scores with more weight on exact matches
  return Math.min(1.0, exactMatchScore + (partialMatchScore * 0.5));
}

// Function to search posts with basic text matching
export async function searchBlogPosts(query: string): Promise<BlogPostProps[]> {
  if (!query) return [];
  
  const posts = await loadBlogPosts();
  const lowerCaseQuery = query.toLowerCase();
  
  return posts.filter(post => 
    post.title.toLowerCase().includes(lowerCaseQuery) ||
    post.content.toLowerCase().includes(lowerCaseQuery) ||
    post.summary.toLowerCase().includes(lowerCaseQuery) ||
    post.tags?.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
  );
}

// Enhanced search function with similarity scoring
export async function searchBlogPostsWithScoring(
  query: string, 
  selectedTags: string[] = [], 
  useTagWeights: boolean = true
): Promise<BlogPostProps[]> {
  // Always return all posts but order by relevance
  const posts = await loadBlogPosts();
  const now = new Date();
  
  // Constants for scoring - adjusted to increase tag priority
  const TEXT_MATCH_WEIGHT = 25;      // Weight for text similarity (reduced)
  const IOU_WEIGHT = 75;             // Weight for tag IoU score (increased)
  const RECENCY_MAX_SCORE = 5;       // Maximum score for recency
  const RECENCY_TIMEFRAME_DAYS = 90; // Timeframe for recency scoring (90 days)
  
  // No filtering - process all posts
  return posts
    .map(post => {
      // Calculate text similarity scores
      let textScore = 0;
      if (query) {
        const titleSimilarity = calculateTextSimilarity(query, post.title) * 1.5; // Title matches worth more
        const summarySimilarity = calculateTextSimilarity(query, post.summary);
        const contentSimilarity = calculateTextSimilarity(query, post.content) * 0.8; // Content matches worth less
        
        // Combine text scores, prioritizing title matches
        textScore = Math.min(1.0, (titleSimilarity + summarySimilarity + contentSimilarity) / 3);
      }
      
      // Calculate tag-based score (using IoU)
      let tagScore = 0;
      if (selectedTags.length > 0) {
        const postTags = post.tags || [];
        
        // Calculate Intersection over Union (IoU) score
        const intersection = postTags.filter(tag => selectedTags.includes(tag));
        const union = new Set([...postTags, ...selectedTags]);
        
        // IoU score is 0 if there are no tags at all
        const baseIouScore = union.size === 0 ? 0 : (intersection.length / union.size);
        
        // Apply tag weights if enabled
        let iouScore = baseIouScore;
        if (useTagWeights) {
          // Calculate weighted intersection
          const weightedIntersection = intersection.reduce((sum, tag) => {
            const weight = TAG_WEIGHTS[tag] || 1.0;
            return sum + weight;
          }, 0);
          
          // Calculate weighted union
          const weightedUnion = Array.from(union).reduce((sum, tag) => {
            const weight = TAG_WEIGHTS[tag] || 1.0;
            return sum + weight;
          }, 0);
          
          // Calculate weighted IoU score
          iouScore = weightedUnion === 0 ? 0 : (weightedIntersection / weightedUnion);
        }
        
        tagScore = iouScore;
      }
      
      // Calculate recency score
      let recencyScore = 0;
      if (post.date) {
        const postDate = new Date(post.date);
        const daysDifference = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDifference <= RECENCY_TIMEFRAME_DAYS) {
          recencyScore = RECENCY_MAX_SCORE * (1 - daysDifference / RECENCY_TIMEFRAME_DAYS);
        }
      }
      
      // Calculate weighted scores
      const weightedTextScore = query ? textScore * TEXT_MATCH_WEIGHT : 0;
      const weightedTagScore = selectedTags.length > 0 ? tagScore * IOU_WEIGHT : 0;
      
      // Combined score - we prioritize tag matches over text matches
      let relevanceScore = 0;
      const hasMatchingTag = selectedTags.length > 0 && (post.tags?.some(tag => selectedTags.includes(tag)) || false);
      
      // Primary ordering by tag match presence, then by specific scores
      if (selectedTags.length > 0) {
        if (hasMatchingTag) {
          // Posts with matching tags get highest priority bracket
          relevanceScore = 1000000 + weightedTagScore + weightedTextScore + recencyScore;
        } else if (query) {
          // Posts without matching tags but with keyword matches get second priority bracket
          relevanceScore = weightedTextScore + recencyScore;
        } else {
          // Posts without any matches get lowest relevance but still displayed
          relevanceScore = recencyScore;
        }
      } else if (query) {
        // Text search only - all posts ordered by text match
        relevanceScore = weightedTextScore + recencyScore;
      } else {
        // No search criteria - order by recency
        relevanceScore = recencyScore;
      }
        // For display purpose, keep track of matched tags
      const matchedTags = selectedTags.length > 0 
        ? post.tags?.filter(tag => selectedTags.includes(tag)) || []
        : [];
      
      return { 
        post, 
        relevanceScore,
        // Include component scores for debugging and display
        debug: { 
          textScore,
          tagScore,
          weightedTextScore,
          weightedTagScore,
          recencyScore,
          matchedTags
        }
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance (descending)
    .map(item => ({
      ...item.post,
      matchedTags: item.debug.matchedTags
    }));
}

// Function to get all unique tags from all blog posts
export async function getAllTags(): Promise<string[]> {
  const posts = await loadBlogPosts();
  const tagsSet = new Set<string>();
  
  posts.forEach(post => {
    (post.tags || []).forEach(tag => {
      tagsSet.add(tag);
    });
  });
  
  return Array.from(tagsSet).sort();
}

// Define tag importance weights
export const TAG_WEIGHTS: Record<string, number> = {
  // Higher weights for important legal categories (sample weights)
  "EU Law": 1.5,
  "Regulation": 1.3,
  "Directive": 1.3,
  "Supreme Court": 1.5,
  "Constitutional Law": 1.4,
  "Human Rights": 1.4,
  // Add more weighted tags as needed
};

// Function to filter posts by selected tags and sort by relevance
export async function filterPostsByTags(
  selectedTags: string[], 
  useTagWeights: boolean = true
): Promise<BlogPostProps[]> {
  // Always return all posts but prioritize those with matching tags
  const posts = await loadBlogPosts();
  const now = new Date();
  
  // Constants for scoring
  const IOU_WEIGHT = 70;            // Weight for Intersection over Union score (0-1 range)
  const RECENCY_MAX_SCORE = 5;      // Maximum score for recency
  const RECENCY_TIMEFRAME_DAYS = 90; // Timeframe for recency scoring (90 days)
  
  return posts
    .map(post => {
      const postTags = post.tags || [];
      
      // Calculate Intersection over Union (IoU) score
      const intersection = postTags.filter(tag => selectedTags.includes(tag));
      const union = new Set([...postTags, ...selectedTags]);
      
      // IoU score is 0 if there are no tags at all
      const baseIouScore = union.size === 0 ? 0 : (intersection.length / union.size);
      
      // Apply tag weights if enabled
      let weightedIouScore = baseIouScore;
      if (useTagWeights) {
        // Calculate weighted intersection by giving more importance to priority tags
        const weightedIntersection = intersection.reduce((sum, tag) => {
          const weight = TAG_WEIGHTS[tag] || 1.0; // Default weight is 1.0
          return sum + weight;
        }, 0);
        
        // Calculate weighted union size (considering weights)
        const weightedUnion = Array.from(union).reduce((sum, tag) => {
          const weight = TAG_WEIGHTS[tag] || 1.0;
          return sum + weight;
        }, 0);
        
        // Calculate weighted IoU score
        weightedIouScore = weightedUnion === 0 ? 0 : (weightedIntersection / weightedUnion);
      }
      
      // Use the weighted or standard IoU score based on settings
      const iouScore = useTagWeights ? weightedIouScore : baseIouScore;
      
      // Calculate recency score
      let recencyScore = 0;
      if (post.date) {
        const postDate = new Date(post.date);
        const daysDifference = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        // Higher score for more recent posts, on a scale of 0 to RECENCY_MAX_SCORE
        if (daysDifference <= RECENCY_TIMEFRAME_DAYS) {
          recencyScore = RECENCY_MAX_SCORE * (1 - daysDifference / RECENCY_TIMEFRAME_DAYS);
        }
      }
      
      // Calculate total relevance score
      // Posts with matching tags get a huge boost to ensure they appear first
      const hasMatchingTag = postTags.some(tag => selectedTags.includes(tag));
      
      // Significantly boost posts with matching tags to ensure they appear first
      const tagScore = iouScore * IOU_WEIGHT;
      const relevanceScore = hasMatchingTag 
        ? 1000000 + tagScore + recencyScore // Posts with matching tags
        : recencyScore;               // Posts without matching tags
      
      return { 
        post, 
        relevanceScore,
        // Include component scores for debugging if needed
        debug: { 
          iouScore,
          tagScore,
          recencyScore,
          matchedTags: intersection
        }
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance (descending)
    .map(item => ({
      ...item.post,
      matchedTags: item.debug.matchedTags
    }));
}

// Function to save a new blog post
export async function createBlogPost(_post: BlogPostProps): Promise<boolean> {
  throw new Error('createBlogPost should not be called directly. Use BlogServiceFactory instead.');
}

// Function to update an existing blog post  
export async function updateBlogPost(_id: string, _updatedPost: BlogPostProps): Promise<boolean> {
  throw new Error('updateBlogPost should not be called directly. Use BlogServiceFactory instead.');
}

// Function to delete a blog post
export async function deleteBlogPost(_id: string): Promise<boolean> {
  throw new Error('deleteBlogPost should not be called directly. Use BlogServiceFactory instead.');
}
