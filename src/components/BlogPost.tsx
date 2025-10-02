import '../styles/BlogPost.css';
import type { BlogPostProps } from '../types';
import { useNavigate } from 'react-router-dom';
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
  attachments,
  // relevancePercentage no longer used for star rating
  matchedTags
}: BlogPostProps) => {
  const navigate = useNavigate();
  
  const handleReadMore = () => {
    // If there are attachments, open the first one in a new tab
    if (attachments && attachments.length > 0) {
      try {
        AttachmentServiceFactory.viewFile(attachments[0]);
      } catch (error) {
        console.error('Error viewing file:', error);
        alert('Failed to view file');
      }
    } else {
      // If no attachments, navigate to the detailed page
      navigate(`/post/${id}`);
    }
  };
  
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
        <button onClick={handleReadMore} className="read-more-button">Read More</button>
      </div>
    </div>
  );
};

export default BlogPost;
