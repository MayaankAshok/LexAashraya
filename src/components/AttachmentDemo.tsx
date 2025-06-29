import React, { useState } from 'react';
import AttachmentUpload from './AttachmentUpload';
import type { Attachment } from '../types';

const AttachmentDemo: React.FC = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>React-Only File System Demo</h1>
      <p>
        This demo shows file system persistence using only React and browser APIs.
        It will first try to use the File System Access API (Chrome/Edge) and fallback to localStorage.
      </p>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>How it works:</h3>
        <ul>
          <li><strong>File System Access API</strong>: In supported browsers, you'll be asked to select a folder where files will be saved</li>
          <li><strong>localStorage fallback</strong>: In other browsers, files are stored as base64 in localStorage</li>
          <li>Files can be uploaded, downloaded, and deleted</li>
          <li>Metadata is preserved across browser sessions</li>
        </ul>
      </div>

      <AttachmentUpload 
        attachments={attachments} 
        onAttachmentsChange={setAttachments}
        maxFileSize={10}
      />

      {attachments.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Current Attachments:</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {JSON.stringify(attachments, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AttachmentDemo;
