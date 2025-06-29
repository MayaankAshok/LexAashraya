// React component for creating and adding a new blog post
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BlogPostProps, Attachment } from '../types';
import AttachmentUpload from './AttachmentUpload';
import '../styles/NewPostForm.css';

interface NewPostFormProps {
  onPostCreated: (newPost: BlogPostProps) => void;
}

const NewPostForm = ({ onPostCreated }: NewPostFormProps) => {
  const navigate = useNavigate();  const [formData, setFormData] = useState({
    title: '',
    author: '',
    summary: '',
    content: '',
    jurisdiction: 'Federal',
    tags: ''
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    // Generate an ID based on the title
    const id = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
        // Create a new post object
    const newPost: BlogPostProps = {
      id: id,
      title: formData.title,
      date: new Date().toISOString().split('T')[0],
      author: formData.author,
      summary: formData.summary,
      content: formData.content,
      tags: tagsArray,
      jurisdiction: formData.jurisdiction,
      attachments: attachments.length > 0 ? attachments : undefined
    };
    
    // Pass the new post to the parent component
    onPostCreated(newPost);
      // Reset the form
    setFormData({
      title: '',
      author: '',
      summary: '',
      content: '',
      jurisdiction: 'Federal',
      tags: ''
    });
    setAttachments([]);
    
    // Navigate back to the main page
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="new-post-container">
      <h2>Create New Legal Article</h2>
      <p className="form-description">
        Add a new legal analysis or commentary to the blog.
      </p>
      
      <form onSubmit={handleSubmit} className="new-post-form">
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
          <button type="submit" className="submit-button">
            Publish Article
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPostForm;
