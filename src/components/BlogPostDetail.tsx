import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { BlogPostProps } from '../types';
import { BlogServiceFactory } from '../services/blogServiceFactory';
import { ClientAttachmentService } from '../services/clientAttachmentService';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import '../styles/BlogPostDetail.css';

const BlogPostDetail = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<BlogPostProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadPost() {
      if (!id) {
        setError("No post ID provided");
        setIsLoading(false);
        return;
      }      try {
        setIsLoading(true);
        const postData = await BlogServiceFactory.getPostById(id);
        
        if (!postData) {
          setError("Post not found");
        } else {
          setPost(postData);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading post:', err);
        setError("Failed to load the article");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPost();
  }, [id]);
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return <div className="loading-state">Loading article...</div>;
  }
  
  if (error || !post) {
    return (
      <div className="error-state">
        <h2>{error || "Article not found"}</h2>
        <button onClick={handleBackClick} className="back-button">
          Back to Articles
        </button>
      </div>
    );
  }  return (
    <div className="blog-post-detail">
      <button onClick={handleBackClick} className="back-button">
        ← Back to Articles
      </button>
      
      {post.image && (
        <div className="detail-image">
          <img src={post.image} alt={post.title} />
        </div>
      )}
      
      <div className="detail-header">
        <h1>{post.title}</h1>
        <div className="detail-meta">
          <span className="detail-date">{post.date}</span>
          <span className="detail-author">by {post.author}</span>
          {post.jurisdiction && <span className="detail-jurisdiction">Jurisdiction: {post.jurisdiction}</span>}
          {post.citation && <span className="detail-citation">Citation: {post.citation}</span>}
        </div>
      </div>
      
      <div className="detail-tags">
        {(!post.tags || post.tags.length === 0) ? (
          <span className="detail-tag">Legal Analysis</span>
        ) : (
          post.tags.map((tag, index) => (
            <span key={index} className="detail-tag">{tag}</span>
          ))
        )}
      </div>
      
      <div className="detail-summary">
        <h2>Summary</h2>
        <p>{post.summary}</p>
      </div>
        <div className="detail-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {post.content}
        </ReactMarkdown>
      </div>
      
      {post.attachments && post.attachments.length > 0 && (
        <div className="detail-attachments">
          <h2>Attachments</h2>
          <div className="attachments-grid">
            {post.attachments.map((attachment) => (
              <div key={attachment.id} className="attachment-card">
                <div className="attachment-info">
                  <div className="attachment-icon">
                    {attachment.type.includes('pdf') ? '📄' : 
                     attachment.type.includes('word') ? '📝' : 
                     attachment.type.includes('powerpoint') || attachment.type.includes('presentation') ? '📊' : '📎'}
                  </div>
                  <div className="attachment-details">
                    <h3 className="attachment-name">{attachment.name}</h3>
                    <div className="attachment-meta">
                      <span className="attachment-size">
                        {attachment.size < 1024 ? `${attachment.size} B` :
                         attachment.size < 1024 * 1024 ? `${(attachment.size / 1024).toFixed(1)} KB` :
                         `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}
                      </span>
                      <span className="attachment-date">
                        Added {new Date(attachment.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>                <div className="attachment-actions">                  <button 
                    className="view-attachment-btn"
                    onClick={() => {
                      try {
                        ClientAttachmentService.viewFile(attachment);
                      } catch (error) {
                        console.error('Error viewing file:', error);
                        alert('Failed to view file');
                      }
                    }}
                  >
                    <span className="view-icon">👁️</span>
                    View
                  </button>                  <button 
                    className="download-attachment-btn"
                    onClick={async () => {
                      try {
                        await ClientAttachmentService.downloadFile(attachment);
                      } catch (error) {
                        console.error('Error downloading file:', error);
                        alert('Failed to download file');
                      }
                    }}
                  >
                    <span className="download-icon">⬇️</span>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPostDetail;
