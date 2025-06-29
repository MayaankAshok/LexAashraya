import type { Attachment } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export class AttachmentService {
  /**
   * Upload files to the server
   */
  static async uploadFiles(files: File[]): Promise<Attachment[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/attachments/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.attachments;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
  /**
   * Download a file from the server
   */
  static async downloadFile(attachment: Attachment): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/attachments/download/${attachment.filename}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * View a file in the browser (opens in new tab)
   */
  static viewFile(attachment: Attachment): void {
    try {
      const viewUrl = `${API_BASE_URL}/attachments/view/${attachment.filename}`;
      window.open(viewUrl, '_blank');
    } catch (error) {
      console.error('View error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from the server
   */
  static async deleteFile(filename: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/attachments/${filename}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errorData.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists on the server
   */
  static async fileExists(filename: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/attachments/info/${filename}`);
      return response.ok;
    } catch (error) {
      console.error('File check error:', error);
      return false;
    }
  }

  /**
   * Get file info from the server
   */
  static async getFileInfo(filename: string): Promise<{ exists: boolean; size?: number; modified?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/attachments/info/${filename}`);
      
      if (!response.ok) {
        return { exists: false };
      }

      return await response.json();
    } catch (error) {
      console.error('File info error:', error);
      return { exists: false };
    }
  }

  /**
   * Health check for the server
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
