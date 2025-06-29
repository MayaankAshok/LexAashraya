import { useState, useEffect, useCallback } from 'react';
import { BlogServiceFactory } from '../services/blogServiceFactory';
import type { BlogPostProps } from '../types';
import '../styles/SearchPanel.css';

interface TagSearchPanelProps {
  onTagSearch: (
    posts: BlogPostProps[], 
    searchMode?: 'all' | 'tag' | 'keyword' | 'combined',
    query?: string,
    tags?: string[]
  ) => void;
}

const TagSearchPanel = ({ onTagSearch }: TagSearchPanelProps) => {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [textSearchQuery, setTextSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchMode, setSearchMode] = useState<'tag' | 'keyword' | 'combined'>('tag');
  // Load all available tags and initial posts
  useEffect(() => {    async function loadInitialData() {
      setIsLoading(true);      try {        const tags = await BlogServiceFactory.getAllTags();
        setAllTags(tags);
        loadAllPosts();
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);  // Load all posts (no filtering)
  const loadAllPosts = async () => {
    setIsLoading(true);
    try {
      const result = await BlogServiceFactory.getAllPosts();
      onTagSearch(result.posts, 'all');
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Debounce function to prevent excessive API calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: number;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string, tags: string[]) => {
      performSearch(query, tags);
    }, 300),
    []
  );

  // Filter tags based on tag search query
  const filteredTags = tagSearchQuery.trim() 
    ? allTags.filter(tag => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
    : allTags;
  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prevSelectedTags => {
      const isSelected = prevSelectedTags.includes(tag);
      
      // Toggle tag selection
      const newSelectedTags = isSelected
        ? prevSelectedTags.filter(t => t !== tag)
        : [...prevSelectedTags, tag];
      
      // Always show all posts, but prioritize those matching the selected tags
      if (newSelectedTags.length > 0) {
        // If we have text search as well, use combined search with tag priority
        if (textSearchQuery.trim()) {
          debouncedSearch(textSearchQuery, newSelectedTags);
          setSearchMode('combined');
        } else {
          // Only tag-based sorting
          updateTagSearchResults(newSelectedTags);
          setSearchMode('tag');
        }
      } else if (textSearchQuery.trim()) {
        // No tags selected but we have text search
        debouncedSearch(textSearchQuery, []);
        setSearchMode('keyword');
      } else {
        // No tags or text search
        loadAllPosts();
      }
      
      return newSelectedTags;
    });
  };  // Handle text search input
  const handleTextSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setTextSearchQuery(query);
    
    // Always prioritize tag search if tags are selected
    if (selectedTags.length > 0) {
      if (query.trim()) {
        // Combined search (tags + text) but with enhanced tag priority
        debouncedSearch(query, selectedTags);
        setSearchMode('combined');
      } else {
        // Tags only - use dedicated tag search for better results
        updateTagSearchResults(selectedTags);
        setSearchMode('tag');
      }
    } else {
      // No tags selected
      if (query.trim()) {
        // Text search only
        debouncedSearch(query, []);
        setSearchMode('keyword');
      } else {
        // No search criteria
        loadAllPosts();
      }
    }
  };  // Update search results based on tags only
  const updateTagSearchResults = async (tags: string[]) => {
    setIsLoading(true);
    try {
      const result = await BlogServiceFactory.getAllPosts(undefined, tags, 'tag');
      onTagSearch(result.posts, 'tag', undefined, tags);
    } catch (error) {
      console.error('Failed to filter posts by tags:', error);
    } finally {
      setIsLoading(false);
    }
  };  // Combined search with text and/or tags
  const performSearch = async (query: string, tags: string[]) => {
    setIsLoading(true);
    try {
      // Determine the search mode
      const mode = tags.length > 0 && query ? 'combined' : 
                   tags.length > 0 ? 'tag' : 
                   query ? 'keyword' : 'all';
      
      const results = await BlogServiceFactory.getAllPosts(query, tags, mode);
      
      // Update search info to indicate which search mode is active
      onTagSearch(
        results.posts, 
        mode,
        query,
        tags
      );
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };// Clear all selected tags and text search
  const handleClearAll = () => {
    setSelectedTags([]);
    setTextSearchQuery('');
    setSearchMode('tag');
    loadAllPosts();
  };

  // Clear only text search
  const handleClearTextSearch = () => {
    setTextSearchQuery('');
    if (selectedTags.length > 0) {
      updateTagSearchResults(selectedTags);
      setSearchMode('tag');
    } else {
      loadAllPosts();
    }
  };

  return (
    <div className="search-panel">
      <h2>Search</h2>
      
      {/* Keyword Search */}
      <div className="keyword-search">
        <div className="search-field">
          <input
            type="text"
            placeholder="Search by keyword..."
            value={textSearchQuery}
            onChange={handleTextSearchInput}
            className="search-input"
          />
          {textSearchQuery && (
            <button 
              className="clear-search-button" 
              onClick={handleClearTextSearch}
              title="Clear keyword search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* Tag Filter */}
      <div className="tag-search">
        <h3>Filter by Topic</h3>
        <div className="search-field">
          <input
            type="text"
            placeholder="Filter topics..."
            value={tagSearchQuery}
            onChange={(e) => setTagSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      {/* Selected Topics section */}
      <div className="selected-tags">
        {(selectedTags.length > 0 || textSearchQuery) && (
          <>
            <div className="selected-tags-header">
              <h4>
                {searchMode === 'tag' ? 'Selected Topics' : 
                 searchMode === 'keyword' ? 'Keyword Search' : 
                 'Combined Search'}
              </h4>
              <button className="clear-tags-button" onClick={handleClearAll}>
                Clear All
              </button>
            </div>
            {selectedTags.length > 0 && (
              <div className="tag-pills">
                {selectedTags.map(tag => (
                  <span key={tag} className="tag-pill">
                    {tag} 
                    <button 
                      onClick={() => handleTagToggle(tag)}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {textSearchQuery && (
              <div className="search-info">
                Searching for: <span className="search-term">{textSearchQuery}</span>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="tag-list">
        <h3>Legal Topics</h3>
        {isLoading ? (
          <div className="loading-tags">Loading topics...</div>
        ) : (
          <div className="tag-checkboxes">
            {filteredTags.length === 0 ? (
              <p className="no-tags-found">No topics found</p>
            ) : (
              filteredTags.map(tag => (
                <div key={tag} className="tag-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                    />
                    <span className={selectedTags.includes(tag) ? 'tag-selected' : ''}>
                      {tag}
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSearchPanel;
