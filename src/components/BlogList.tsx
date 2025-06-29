import type { BlogPostProps } from '../types';
import BlogPost from './BlogPost';
import '../styles/BlogList.css';

interface SearchInfoProps {
  mode: 'all' | 'tag' | 'keyword' | 'combined';
  query?: string;
  tags?: string[];
}

interface BlogListProps {
  posts: BlogPostProps[];
  searchInfo?: SearchInfoProps;
  isLoading?: boolean;
  error?: string | null;
}

const BlogList = ({ 
  posts, 
  searchInfo = { mode: 'all' }, 
  isLoading = false, 
  error = null 
}: BlogListProps) => {  // Generate search result description
  const getSearchDescription = () => {
    if (searchInfo.mode === 'all') return "All posts ordered by date (newest first)";
    
    if (searchInfo.mode === 'tag' && searchInfo.tags?.length) {
      return `All posts ordered by relevance to topics: ${searchInfo.tags.join(', ')} (most relevant first)`;
    }
    
    if (searchInfo.mode === 'keyword' && searchInfo.query) {
      return `All posts ordered by relevance to: "${searchInfo.query}" (most relevant first)`;
    }
    
    if (searchInfo.mode === 'combined') {
      const tagStr = searchInfo.tags?.length ? `topics: ${searchInfo.tags.join(', ')}` : '';
      const queryStr = searchInfo.query ? `"${searchInfo.query}"` : '';
      const connector = tagStr && queryStr ? ' and keyword ' : '';
      // Put tag search first to indicate priority
      return `All posts ordered by relevance to ${tagStr}${connector}${queryStr} (most relevant first)`;
    }
    
    return "All posts ordered by date (newest first)";
  };
    const searchDescription = getSearchDescription();
  
  // We're displaying all posts ordered by relevance
  const filteredPosts = posts;

  return (
    <div className="blog-list">
      <h1>Legal Analysis & Commentary</h1>
      
      {searchDescription && (
        <div className="search-results">
          {searchDescription}
        </div>
      )}
      
      {isLoading && (
        <div className="loading-state">
          <p>Loading articles...</p>
        </div>
      )}
      
      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}
        {!isLoading && !error && filteredPosts.length === 0 && (
        <div className="no-posts">
          <p>No posts available</p>
        </div>
      )}
      
      {!isLoading && !error && filteredPosts.length > 0 && (
        filteredPosts.map((post) => <BlogPost key={post.id} {...post} />)
      )}
    </div>
  );
};

export default BlogList;
