import type { Attachment } from '../types';

/**
 * Client-side attachment service for static file handling
 * Works with files stored in the data/uploads directory
 */
export class ClientAttachmentService {
  // Base path for attachments in the static build
  private static readonly UPLOADS_BASE_PATH = '/data/uploads/';

  /**
   * Upload files - for static hosting, this would be handled differently
   * This method is kept for compatibility but will show an error
   */
  static async uploadFiles(_files: File[]): Promise<Attachment[]> {
    console.warn('File upload is not supported in static hosting mode');
    throw new Error('File upload is not available in static hosting mode. Files must be manually placed in the data/uploads directory.');
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
   * Delete a file - not supported in static hosting
   */
  static async deleteFile(_filename: string): Promise<void> {
    console.warn('File deletion is not supported in static hosting mode');
    throw new Error('File deletion is not available in static hosting mode. Files must be manually removed from the data/uploads directory.');
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
   * Get file info - limited info available for static files
   */
  static async getFileInfo(filename: string): Promise<{ exists: boolean; size?: number; modified?: string }> {
    try {
      const fileUrl = `${this.UPLOADS_BASE_PATH}${filename}`;
      const response = await fetch(fileUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return { exists: false };
      }

      const size = response.headers.get('content-length');
      const modified = response.headers.get('last-modified');

      return {
        exists: true,
        size: size ? parseInt(size) : undefined,
        modified: modified || undefined
      };
    } catch (error) {
      console.error('File info error:', error);
      return { exists: false };
    }
  }

  /**
   * Health check - always returns true for static files
   */
  static async healthCheck(): Promise<boolean> {
    return true;
  }
}
