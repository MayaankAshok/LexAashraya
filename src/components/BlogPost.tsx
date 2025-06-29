import '../styles/BlogPost.css';
import type { BlogPostProps } from '../types';
import { Link } from 'react-router-dom';
import { AttachmentServiceFactory } from '../services/attachmentServiceFactory';

const BlogPost = ({ 
  id, 
  title, 
  date, 
  author, 
  summary, 
  image, 
  tags, 
  citation, 
  jurisdiction,
  attachments,
  // relevancePercentage no longer used for star rating
  matchedTags
}: BlogPostProps) => {
  
  return (
    <div className="blog-post">
      {image && (
        <div className="blog-image">
          <img src={image} alt={title} />
        </div>
      )}
        <div className="blog-header">
        <h2>{title}</h2>
          <div className="blog-meta">
          <span className="blog-date">{date}</span>
          <span className="blog-author">by {author}</span>
          {jurisdiction && <span className="blog-jurisdiction">Jurisdiction: {jurisdiction}</span>}
          {citation && <span className="blog-citation">Citation: {citation}</span>}
          {attachments && attachments.length > 0 && (
            <span className="blog-attachments">
              📎 {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      <div className="blog-summary">{summary}</div>
      
      {/* Attachment tiles */}
      {attachments && attachments.length > 0 && (
        <div className="blog-attachments-section">
          <div className="attachment-tiles">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className="attachment-tile"                onClick={() => {
                  try {
                    AttachmentServiceFactory.viewFile(attachment);
                  } catch (error) {
                    console.error('Error viewing file:', error);
                    alert('Failed to view file');
                  }
                }}
                title={`Click to view ${attachment.name}`}
              >
                <div className="attachment-tile-icon">
                  {attachment.type.includes('pdf') ? '📄' : 
                   attachment.type.includes('word') ? '📝' : 
                   attachment.type.includes('powerpoint') || attachment.type.includes('presentation') ? '📊' : '📎'}
                </div>
                <div className="attachment-tile-name">{attachment.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="blog-footer">
        <div className="blog-tags">
          {/* Display default tags if none provided */}
          {(!tags || tags.length === 0) ? (
            <span className="blog-tag">Legal Analysis</span>
          ) : (
            tags.map((tag, index) => (
              <span key={index} className={`blog-tag ${matchedTags?.includes(tag) ? 'matched-tag' : ''}`}>
                {tag}
              </span>
            ))
          )}
        </div>
        <Link to={`/post/${id}`} className="read-more-button">Read Full Analysis</Link>
      </div>
    </div>
  );
};

export default BlogPost;
