import React, { useState, useRef, useEffect } from 'react';
import type { Attachment } from '../types';
import { AttachmentServiceFactory } from '../services/attachmentServiceFactory';
import '../styles/AttachmentUpload.css';

interface AttachmentUploadProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFileSize?: number; // Max file size in MB
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({ 
  attachments, 
  onAttachmentsChange, 
  maxFileSize = 10 // Default 10MB
}) => {  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storageMethod, setStorageMethod] = useState<string>('Server API');  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we're in admin mode (server uploads available) or static mode
  useEffect(() => {
    if (AttachmentServiceFactory.isAdminEnabled()) {
      setStorageMethod('Server API');
    } else {
      setStorageMethod('Static Mode - Files must be manually added to /data/uploads/');
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📎';
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      if (!hasValidExtension) {
        return 'Invalid file type. Only PDF, Word, and PowerPoint files are allowed.';
      }
    }

    return null;
  };

  const handleFiles = async (files: FileList) => {
    setUploadError(null);
    
    try {
      // Validate files first
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        const error = validateFile(file);
        if (error) {
          setUploadError(error);
          return;
        }

        // Check for duplicate names
        const existingNames = attachments.map(att => att.name);
        if (existingNames.includes(file.name)) {
          setUploadError(`File "${file.name}" already exists`);
          return;
        }

        validFiles.push(file);
      }      if (validFiles.length === 0) {
        return;
      }

      // Use the AttachmentServiceFactory to handle uploads (admin or static mode)
      const uploadedAttachments = await AttachmentServiceFactory.uploadFiles(validFiles);
      
      // Add the uploaded attachments to the existing list
      const updatedAttachments = [...attachments, ...uploadedAttachments];
      onAttachmentsChange(updatedAttachments);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };  const removeAttachment = async (id: string, filename: string) => {
    try {
      // Try to delete the file using the service factory
      // In admin mode: actually deletes from server
      // In static mode: will show appropriate error but still remove from UI
      try {
        await AttachmentServiceFactory.deleteFile(filename);
      } catch (deleteError) {
        // If deletion fails (e.g., static mode), we'll still remove from UI
        console.warn('File deletion failed:', deleteError);
      }
      
      // Remove from the current list
      const updatedAttachments = attachments.filter(att => att.id !== id);
      onAttachmentsChange(updatedAttachments);
    } catch (error) {
      setUploadError('Failed to remove file');
    }
  };const downloadAttachment = async (attachment: Attachment) => {
    try {
      await AttachmentServiceFactory.downloadFile(attachment);
    } catch (error) {
      setUploadError('Failed to download file');
    }
  };

  return (
    <div className="attachment-upload">      <div className="attachment-upload-header">
        <label>Attachments</label>
        <span className="attachment-info">
          Supported: PDF, Word, PowerPoint (Max {maxFileSize}MB each) | Storage: {storageMethod}
        </span>
      </div>

      {/* Upload Area */}
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-content">
          <div className="upload-icon">📎</div>
          <div className="upload-text">
            <p>Drag and drop files here, or click to select</p>
            <p className="upload-subtext">PDF, Word documents, and PowerPoint presentations</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="upload-error">
          {uploadError}
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="attachments-list">
          <h4>Attached Files ({attachments.length})</h4>
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-info-section">
                <span className="attachment-icon">{getFileIcon(attachment.type)}</span>
                <div className="attachment-details">
                  <span className="attachment-name">{attachment.name}</span>
                  <span className="attachment-meta">
                    {formatFileSize(attachment.size)} • {new Date(attachment.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="attachment-actions">
                <button
                  type="button"
                  onClick={() => downloadAttachment(attachment)}
                  className="download-button"
                  title="Download file"
                >
                  ⬇️
                </button>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id, attachment.filename)}
                  className="remove-button"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentUpload;
