// Service factory to switch between client and server attachment services based on build mode
import { AttachmentService } from './attachmentService';
import { ClientAttachmentService } from './clientAttachmentService';
import type { Attachment } from '../types';

// Declare global build-time constants
declare const __BUILD_MODE__: string;
declare const __ADMIN_ENABLED__: boolean;

// Check if we're in admin mode
const isAdminMode = () => {
  return __ADMIN_ENABLED__ || import.meta.env.VITE_ADMIN_ENABLED === 'true';
};

export class AttachmentServiceFactory {
  /**
   * Upload attachments (only available in admin mode)
   */
  static async uploadFiles(files: File[]): Promise<Attachment[]> {
    if (isAdminMode()) {
      return AttachmentService.uploadFiles(files);
    } else {
      return ClientAttachmentService.uploadFiles(files);
    }
  }

  /**
   * View a file in the browser
   * Always uses static client service for consistent static functionality
   */
  static viewFile(attachment: Attachment): void {
    // Always use client service for viewing files to maintain static functionality
    return ClientAttachmentService.viewFile(attachment);
  }

  /**
   * Download a file
   * Always uses static client service for consistent static functionality
   */
  static async downloadFile(attachment: Attachment): Promise<void> {
    // Always use client service for downloading files to maintain static functionality
    return ClientAttachmentService.downloadFile(attachment);
  }

  /**
   * Delete attachment (only available in admin mode)
   */
  static async deleteFile(filename: string): Promise<void> {
    if (isAdminMode()) {
      return AttachmentService.deleteFile(filename);
    } else {
      return ClientAttachmentService.deleteFile(filename);
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filename: string): Promise<boolean> {
    if (isAdminMode()) {
      return AttachmentService.fileExists(filename);
    } else {
      return ClientAttachmentService.fileExists(filename);
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(filename: string): Promise<{ exists: boolean; size?: number; modified?: string }> {
    if (isAdminMode()) {
      return AttachmentService.getFileInfo(filename);
    } else {
      return ClientAttachmentService.getFileInfo(filename);
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    if (isAdminMode()) {
      return AttachmentService.healthCheck();
    } else {
      return ClientAttachmentService.healthCheck();
    }
  }

  /**
   * Check if admin features are enabled
   */
  static isAdminEnabled(): boolean {
    return isAdminMode();
  }

  /**
   * Get current build mode
   */
  static getBuildMode(): string {
    return __BUILD_MODE__ || import.meta.env.VITE_BUILD_MODE || 'static';
  }
}
