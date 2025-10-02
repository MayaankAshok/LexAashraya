import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import './styles/App.css'
import TagSearchPanel from './components/TagSearchPanel'
import BlogList from './components/BlogList'
import BlogPostDetail from './components/BlogPostDetail'
import PostEditor from './components/PostEditor'
import Disclaimer from './components/Disclaimer'
import type { BlogPostProps } from './types'
import { BlogServiceFactory } from './services/blogServiceFactory'

function App() {
  const [blogPosts, setBlogPosts] = useState<BlogPostProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [searchInfo, setSearchInfo] = useState<{
    mode: 'all' | 'tag' | 'keyword' | 'combined';
    query?: string;
    tags?: string[];
  }>({ mode: 'all' })
  
  // Function to handle disclaimer close
  const handleDisclaimerClose = () => {
    setShowDisclaimer(false)
    // Store current timestamp to track when disclaimer was accepted
    const now = new Date().getTime()
    localStorage.setItem('disclaimerAccepted', now.toString())
  }
  
  // Function to check if disclaimer should be shown (every 24 hours)
  const shouldShowDisclaimer = useCallback(() => {
    const lastAccepted = localStorage.getItem('disclaimerAccepted')
    if (!lastAccepted) {
      return true // Never accepted before
    }
    
    const lastAcceptedTime = parseInt(lastAccepted)
    const now = new Date().getTime()
    const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    return (now - lastAcceptedTime) >= twentyFourHours
  }, [])
  
  // Function to set posts from search results
  const setPosts = (posts: BlogPostProps[], searchMode: 'all' | 'tag' | 'keyword' | 'combined' = 'all', query?: string, tags?: string[]) => {
    setBlogPosts(posts)
    setSearchInfo({
      mode: searchMode,
      query,
      tags
    })
  }
  
  // Function to handle post changes (for admin mode)
  const handlePostChanged = () => {
    // Reload posts after any changes
    const reloadPosts = async () => {
      try {
        const result = await BlogServiceFactory.getAllPosts()
        setBlogPosts(result.posts)
        setSearchInfo(result.searchInfo)
      } catch (err) {
        console.error('Error reloading posts:', err)
      }
    }
    reloadPosts()
  }
  
  // Load blog posts when component mounts
  useEffect(() => {
    // Check if user needs to see the disclaimer (every 24 hours)
    setShowDisclaimer(shouldShowDisclaimer())
    
    const initializeApp = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load posts directly from data/posts using static functionality
        const result = await BlogServiceFactory.getAllPosts()
        setBlogPosts(result.posts)
        setSearchInfo(result.searchInfo)
      } catch (err) {
        console.error('Error initializing app:', err)
        setError('Failed to load blog posts from data directory.')
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [shouldShowDisclaimer])

  return (
    <div className="app-container">
      <Disclaimer 
        isOpen={showDisclaimer} 
        onClose={handleDisclaimerClose} 
      />
      
      <header className="app-header">
        <Link to="/" className="title-link">
          <h1>Legal Insight</h1>
        </Link>
        <p className="header-tagline">Navigating the Complexities of Law</p>
        {BlogServiceFactory.shouldShowAdminUI() && (
          <div className="admin-controls">
            <Link to="/admin/posts" className="admin-link">Admin: Manage Posts</Link>
          </div>
        )}
      </header>
      
      <Routes>
        {/* Main route with the two-panel layout */}
        <Route path="/" element={
          <div className="blog-layout">
            <div className="left-panel">
              <TagSearchPanel onTagSearch={setPosts} />
            </div>
            <div className="main-panel">
              <BlogList 
                posts={blogPosts} 
                searchInfo={searchInfo}
                isLoading={isLoading} 
                error={error}
              />
            </div>
          </div>
        } />
        
        {/* Detail view route for a specific post */}
        <Route path="/post/:id" element={<BlogPostDetail />} />
        
        {/* Admin routes - always available but link only shown when shouldShowAdminUI is true */}
        <Route path="/admin/posts" element={
          <PostEditor 
            onPostSaved={handlePostChanged}
            onPostDeleted={handlePostChanged}
          />
        } />
        <Route path="/admin/posts/new" element={
          <PostEditor 
            isNew={true}
            onPostSaved={handlePostChanged}
            onPostDeleted={handlePostChanged}
          />
        } />
        <Route path="/admin/posts/edit/:id" element={
          <PostEditor 
            onPostSaved={handlePostChanged}
            onPostDeleted={handlePostChanged}
          />
        } />
      </Routes>
    </div>
  )
}

export default App
