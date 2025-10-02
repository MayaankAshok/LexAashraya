import type { Attachment } from '../types';

/**
 * Client-side attachment service for static file handling
 * Works with files stored in the data/uploads directory
 */
export class ClientAttachmentService {
  // Base path for attachments in the static build
  private static readonly UPLOADS_BASE_PATH = '/data/uploads/';
  // API base URL for server operations
  private static readonly API_BASE_URL = 'http://localhost:3001/api';

  /**
   * Upload files to the server
   */
  static async uploadFiles(files: File[]): Promise<Attachment[]> {
    try {
      const formData = new FormData();
      
      // Add all files to the form data
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.API_BASE_URL}/attachments/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload files');
      }

      const data = await response.json();
      return data.attachments;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Download a file from the static uploads directory
   */
  static async downloadFile(attachment: Attachment): Promise<void> {
    try {
      const fileUrl = `${this.UPLOADS_BASE_PATH}${attachment.filename}`;
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = attachment.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      const fileUrl = `${this.UPLOADS_BASE_PATH}${attachment.filename}`;
      window.open(fileUrl, '_blank');
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
      const response = await fetch(`${this.API_BASE_URL}/attachments/${filename}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists - for static hosting, we assume files exist if referenced
   */
  static async fileExists(filename: string): Promise<boolean> {
    try {
      const fileUrl = `${this.UPLOADS_BASE_PATH}${filename}`;
      const response = await fetch(fileUrl, { method: 'HEAD' });
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
      const response = await fetch(`${this.API_BASE_URL}/attachments/info/${filename}`);
      
      if (!response.ok) {
        return { exists: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('File info error:', error);
      return { exists: false };
    }
  }

  /**
   * Health check - verifies server connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
