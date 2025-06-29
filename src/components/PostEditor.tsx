// React component for managing blog posts (create, edit, delete)
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { BlogPostProps, Attachment } from '../types';
import { BlogServiceFactory } from '../services/blogServiceFactory';
import AttachmentUpload from './AttachmentUpload';
import '../styles/PostEditor.css';

interface PostEditorProps {
  isNew?: boolean;
  onPostSaved?: () => void;
  onPostDeleted?: () => void;
}

const PostEditor = ({ isNew = false, onPostSaved, onPostDeleted }: PostEditorProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
    // Determine if we're in edit mode or create mode
  const isEditMode = location.pathname.includes('/edit/') && id;
  const isCreateMode = isNew || location.pathname.includes('/new');
    const [formData, setFormData] = useState({
    title: '',
    author: '',
    summary: '',
    content: '',
    jurisdiction: 'Federal',
    tags: '',
    citation: '',
    image: ''
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPostProps[]>([]);
  const showPostsList = !isCreateMode && !isEditMode;

  // Load existing post data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadPostForEditing(id);
    } else if (!isCreateMode && !isEditMode) {
      loadAllPosts();
    }
  }, [id, isEditMode, isCreateMode]);  const loadPostForEditing = async (postId: string) => {
    try {
      setIsLoading(true);
      const post = await BlogServiceFactory.getPostById(postId);
      if (post) {
        setFormData({
          title: post.title,
          author: post.author,
          summary: post.summary,
          content: post.content,
          jurisdiction: post.jurisdiction || 'Federal',
          tags: post.tags?.join(', ') || '',
          citation: post.citation || '',
          image: post.image || ''
        });
        setAttachments(post.attachments || []);
        setError(null);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error loading post:', err);
      setError('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };  const loadAllPosts = async () => {    try {
      setIsLoading(true);
      const result = await BlogServiceFactory.getAllPosts();
      setAllPosts(result.posts);
      setError(null);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        // Generate new ID based on title for both create and edit modes
      const newPostId = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const postData: BlogPostProps = {
        id: newPostId,
        title: formData.title,
        date: isEditMode ? (await BlogServiceFactory.getPostById(id!))?.date || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        author: formData.author,
        summary: formData.summary,
        content: formData.content,
        tags: tagsArray,
        jurisdiction: formData.jurisdiction,
        citation: formData.citation || undefined,
        image: formData.image || undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      };      let success = false;
      if (isEditMode) {
        // Pass the original ID (from URL) to updatePost so server knows which file to rename
        const result = await BlogServiceFactory.updatePost(id!, postData);
        success = !!result;
        if (success && onPostSaved) {
          onPostSaved();
        }
      } else {
        const result = await BlogServiceFactory.createPost(postData);
        success = !!result;
        if (success && onPostSaved) {
          onPostSaved();
        }
      }      if (success) {
        navigate('/admin/posts');
      } else {
        setError(isEditMode ? 'Failed to update post' : 'Failed to create post');
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setError(isEditMode ? 'Failed to update post' : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }    try {
      setIsLoading(true);
      await BlogServiceFactory.deletePost(postId);
      // If we get here, deletion was successful
      const deletedPost = allPosts.find(p => p.id === postId);
      if (deletedPost && onPostDeleted) {
        onPostDeleted();
        setAllPosts(posts => posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    navigate('/');
  };
  const handleCreateNew = () => {
    navigate('/admin/posts/new');
  };
  const handleEditPost = (postId: string) => {
    navigate(`/admin/posts/edit/${postId}`);
  };


  if (isLoading) {
    return <div className="loading-state">Loading...</div>;  }

  // Show posts list for main view
  if (showPostsList) {
    return (
      <div className="post-editor-container">
        <div className="editor-header">
          <h2>Manage Blog Posts</h2>
          <button onClick={handleCreateNew} className="create-button">
            Create New Post
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="posts-management">
          {allPosts.length === 0 ? (
            <div className="no-posts">
              <p>No posts available</p>
              <button onClick={handleCreateNew} className="create-button">
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="posts-grid">
              {allPosts.map(post => (
                <div key={post.id} className="post-card">
                  <h3>{post.title}</h3>
                  <div className="post-meta">
                    <span>By {post.author}</span>
                    <span>{post.date}</span>
                    <span>{post.jurisdiction}</span>
                  </div>
                  <p className="post-summary">{post.summary}</p>
                  <div className="post-tags">
                    {post.tags?.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>                  <div className="post-actions">
                    <button 
                      onClick={() => handleEditPost(post.id)} 
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)} 
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show form for create/edit mode
  return (
    <div className="post-editor-container">
      <div className="editor-header">
        <h2>{isEditMode ? 'Edit Legal Article' : 'Create New Legal Article'}</h2>
        <button onClick={handleCancel} className="back-button">
          ← Back to Posts
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="title">Article Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a descriptive title"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="author">Author</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Author name and credentials"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="jurisdiction">Jurisdiction</label>
          <select
            id="jurisdiction"
            name="jurisdiction"
            value={formData.jurisdiction}
            onChange={handleChange}
          >
            <option value="Federal">Federal</option>
            <option value="State">State</option>
            <option value="International">International</option>
            <option value="EU">European Union</option>
            <option value="UK">United Kingdom</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="image">Image URL (optional)</label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-group">
          <label htmlFor="citation">Citation (optional)</label>
          <input
            type="text"
            id="citation"
            name="citation"
            value={formData.citation}
            onChange={handleChange}
            placeholder="e.g., 123 F.3d 456 (9th Cir. 2023)"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="summary">Summary</label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="Brief summary (1-2 sentences)"
            rows={3}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Full Article Content (Markdown Supported)</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your full article here. Markdown formatting is supported."
            rows={15}
            required
          />        </div>
        
        <AttachmentUpload
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          maxFileSize={10}
        />
        
        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., Privacy Law, Data Protection, Compliance"
          />
        </div>

        <div className="form-buttons">
          <button type="button" onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          {isEditMode && (
            <button 
              type="button" 
              onClick={() => handleDelete(id!)} 
              className="delete-button"
              disabled={isLoading}
            >
              Delete Post
            </button>
          )}
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Publish Article')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostEditor;
