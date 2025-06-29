// Common types used across the application

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number; // Size in bytes
  filename: string; // Server-side filename for file system storage
  uploadDate: string; // ISO date string
}

export interface BlogPostProps {
  id: string;
  title: string;
  date: string;
  author: string;
  summary: string;
  content: string;
  image?: string;
  tags?: string[];
  citation?: string;
  jurisdiction?: string;  // For search results
  matchedTags?: string[];        // Tags that matched the search
  attachments?: Attachment[];    // File attachments
}
