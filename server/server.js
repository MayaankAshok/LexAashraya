import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Client as FTPClient } from 'basic-ftp';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// FTP Configuration
const FTP_CONFIG = {
  host: process.env.FTP_HOST?.replace('ftp://', '') || 'your-domain.com',
  user: process.env.FTP_USER || 'your-username',
  password: process.env.FTP_PASSWORD || 'your-password',
  port: parseInt(process.env.FTP_PORT) || 21,
  secure: false, // Set to true if using FTPS
  remoteBasePath: '/data' // Adjust this to your hosting structure
};

// FTP Helper Functions
async function uploadToFTP(localPath, remotePath) {
  const client = new FTPClient();
  // Remove verbose logging to reduce console output
  // client.ftp.verbose = true;
  
  try {
    await client.access(FTP_CONFIG);
    
    // Ensure remote directory exists
    const remoteDir = path.dirname(remotePath);
    try {
      await client.ensureDir(remoteDir);
    } catch (dirError) {
      // Silent directory creation - only log if it fails completely
    }
    
    await client.uploadFrom(localPath, remotePath);
    console.log(`📤 FTP: Uploaded ${path.basename(localPath)} → ${remotePath}`);
    return true;
  } catch (error) {
    console.error(`❌ FTP Upload Error for ${path.basename(localPath)}:`, error.message);
    return false;
  } finally {
    client.close();
  }
}

async function deleteFromFTP(remotePath) {
  const client = new FTPClient();
  // Remove verbose logging to reduce console output
  // client.ftp.verbose = true;
  
  try {
    await client.access(FTP_CONFIG);
    await client.remove(remotePath);
    console.log(`🗑️  FTP: Deleted ${path.basename(remotePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ FTP Delete Error for ${path.basename(remotePath)}:`, error.message);
    return false;
  } finally {
    client.close();
  }
}

async function uploadDirectoryToFTP(localDir, remoteDir) {
  const client = new FTPClient();
  // Remove verbose logging to reduce console output
  // client.ftp.verbose = true;
  
  try {
    await client.access(FTP_CONFIG);
    await client.uploadFromDir(localDir, remoteDir);
    console.log(`📁 FTP: Uploaded directory ${path.basename(localDir)} → ${remoteDir}`);
    return true;
  } catch (error) {
    console.error(`❌ FTP Directory Upload Error for ${path.basename(localDir)}:`, error.message);
    return false;
  } finally {
    client.close();
  }
}

// Helper function to sync post to FTP
async function syncPostToFTP(postId) {
  const localPath = path.join(postsDir, `${postId}.json`);
  const remotePath = `${FTP_CONFIG.remoteBasePath}/posts/${postId}.json`;
  
  if (fs.existsSync(localPath)) {
    return await uploadToFTP(localPath, remotePath);
  }
  return false;
}

// Helper function to sync manifest to FTP
async function syncManifestToFTP() {
  const remotePath = `${FTP_CONFIG.remoteBasePath}/posts-manifest.json`;
  return await uploadToFTP(manifestPath, remotePath);
}

// Helper function to sync attachment to FTP
async function syncAttachmentToFTP(filename) {
  const localPath = path.join(uploadsDir, filename);
  const remotePath = `${FTP_CONFIG.remoteBasePath}/uploads/${filename}`;
  
  if (fs.existsSync(localPath)) {
    return await uploadToFTP(localPath, remotePath);
  }
  return false;
}

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create posts directory if it doesn't exist
const postsDir = path.join(__dirname, '../public/data/posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

// Posts manifest file path
const manifestPath = path.join(__dirname, '../public/data/posts-manifest.json');

// Helper function to read the posts manifest
function readManifest() {
  try {
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf8');
      return JSON.parse(content);
    } else {
      // Return default manifest structure if file doesn't exist
      return { posts: [] };
    }
  } catch (error) {
    console.error('Error reading manifest:', error);
    return { posts: [] };
  }
}

// Helper function to write the posts manifest
function writeManifest(manifest) {
  try {
    // Ensure the directory exists
    const manifestDir = path.dirname(manifestPath);
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }
    
    // Write with explicit encoding and proper formatting
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    console.log('Manifest updated successfully locally');
    
    // Sync to FTP asynchronously with better error handling
    syncManifestToFTP()
      .then(success => {
        if (success) {
          console.log('✅ Manifest synced to FTP successfully');
        } else {
          console.error('❌ Failed to sync manifest to FTP');
        }
      })
      .catch(error => {
        console.error('❌ Error syncing manifest to FTP:', error.message);
      });
    
    return true;
  } catch (error) {
    console.error('Error writing manifest:', error);
    return false;
  }
}

// Helper function to update manifest when post ID changes
function updateManifestForIdChange(oldId, newId) {
  try {
    const manifest = readManifest();
    const posts = manifest.posts || [];
    
    // Find the old ID and replace it with the new ID
    const index = posts.indexOf(oldId);
    if (index !== -1) {
      posts[index] = newId;
      console.log(`Updated manifest: ${oldId} -> ${newId}`);
    } else {
      // If old ID not found, add the new ID
      posts.push(newId);
      console.log(`Added new post to manifest: ${newId}`);
    }
    
    // Remove duplicates and sort
    manifest.posts = [...new Set(posts)].sort();
    
    return writeManifest(manifest);
  } catch (error) {
    console.error('Error updating manifest for ID change:', error);
    return false;
  }
}

// Helper function to add post to manifest
function addPostToManifest(postId) {
  try {
    const manifest = readManifest();
    const posts = manifest.posts || [];
    
    if (!posts.includes(postId)) {
      posts.push(postId);
      manifest.posts = posts.sort();
      return writeManifest(manifest);
    }
    
    return true; // Already exists
  } catch (error) {
    console.error('Error adding post to manifest:', error);
    return false;
  }
}

// Helper function to remove post from manifest
function removePostFromManifest(postId) {
  try {
    const manifest = readManifest();
    const posts = manifest.posts || [];
    
    const index = posts.indexOf(postId);
    if (index !== -1) {
      posts.splice(index, 1);
      manifest.posts = posts;
      return writeManifest(manifest);
    }
    
    return true; // Already doesn't exist
  } catch (error) {
    console.error('Error removing post from manifest:', error);
    return false;
  }
}

// Helper function to read all posts from the filesystem
function getAllPosts() {
  try {
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.json'));
    const posts = files.map(file => {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    });
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

// Helper function to create backup before updating
function createBackup(postId) {
  try {
    const filename = `${postId}.json`;
    const filePath = path.join(postsDir, filename);
    
    if (fs.existsSync(filePath)) {
      const backupDir = path.join(__dirname, '../backups/posts');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${postId}_backup_${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFilename);
      
      fs.copyFileSync(filePath, backupPath);
      console.log(`Backup created: ${backupFilename}`);
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    // Don't fail the operation if backup fails
  }
}

// Helper function to save a post to filesystem
function savePost(post) {
  try {
    // Ensure the posts directory exists
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
    
    const filename = `${post.id}.json`;
    const filePath = path.join(postsDir, filename);
    
    // Write with explicit encoding and proper formatting
    const postContent = JSON.stringify(post, null, 2);
    fs.writeFileSync(filePath, postContent, 'utf8');
    
    console.log(`Post saved successfully: ${filename}`);
    
    // Sync to FTP asynchronously
    syncPostToFTP(post.id).catch(error => {
      console.error(`Failed to sync post ${post.id} to FTP:`, error);
    });
    
    return true;
  } catch (error) {
    console.error('Error saving post:', error);
    return false;
  }
}

// Helper function to delete a post from filesystem
function deletePost(postId) {
  try {
    const filename = `${postId}.json`;
    const filePath = path.join(postsDir, filename);
    
    if (fs.existsSync(filePath)) {
      // Delete the file locally
      fs.unlinkSync(filePath);
      console.log(`Post deleted successfully: ${filename}`);
      
      // Delete from FTP asynchronously
      const remotePath = `${FTP_CONFIG.remoteBasePath}/posts/${filename}`;
      deleteFromFTP(remotePath).catch(error => {
        console.error(`Failed to delete post ${postId} from FTP:`, error);
      });
      
      return true;
    } else {
      console.log(`Post file not found: ${filename}`);
      return false;
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
}

// Helper function to calculate text similarity between query and content
function calculateTextSimilarity(query, text) {
  if (!query || !text) return 0;
  
  const queryWords = query.toLowerCase().split(/\s+/);
  const textWords = text.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  queryWords.forEach(queryWord => {
    if (textWords.some(textWord => textWord.includes(queryWord) || queryWord.includes(textWord))) {
      matchCount++;
    }
  });
  
  return queryWords.length > 0 ? matchCount / queryWords.length : 0;
}

// Pure intersection over union scoring for tags (no hardcoded weights)

// Helper function to score and order posts by relevance
function searchPosts(posts, query, tags, mode = 'all') {
  const now = new Date();
  
  // Constants for scoring - tag score weighted higher than text score
  const TEXT_MATCH_WEIGHT = 30;      // Weight for text similarity
  const TAG_WEIGHT = 70;             // Weight for tag IoU score (higher than text)
  const RECENCY_MAX_SCORE = 5;       // Maximum score for recency
  const RECENCY_TIMEFRAME_DAYS = 90; // Timeframe for recency scoring
  return posts.map(post => {
    // Calculate text similarity scores
    let textScore = 0;
    if (query && query.trim()) {
      const titleSimilarity = calculateTextSimilarity(query, post.title) * 1.5; // Title matches worth more
      const summarySimilarity = calculateTextSimilarity(query, post.summary);
      const contentSimilarity = calculateTextSimilarity(query, post.content) * 0.8; // Content matches worth less
      const authorSimilarity = calculateTextSimilarity(query, post.author) * 0.7;
      const jurisdictionSimilarity = post.jurisdiction ? calculateTextSimilarity(query, post.jurisdiction) * 0.6 : 0;
      
      // Combine text scores, prioritizing title matches
      textScore = Math.min(1.0, (titleSimilarity + summarySimilarity + contentSimilarity + authorSimilarity + jurisdictionSimilarity) / 3);
    }
      // Calculate tag-based score (using pure Intersection over Union)
    let tagScore = 0;
    if (tags && tags.length > 0) {
      const postTags = post.tags || [];
      
      // Calculate Intersection over Union (IoU) score with exact matching
      // Tags are treated as completely distinct - no partial matching
      const intersection = postTags.filter(tag => 
        tags.some(selectedTag => 
          tag.toLowerCase() === selectedTag.toLowerCase()
        )
      );
      const union = new Set([...postTags, ...tags]);
      
      // Pure IoU score without any weights
      tagScore = union.size === 0 ? 0 : (intersection.length / union.size);
    }
    
    // Calculate recency score - all posts get this as a baseline
    let recencyScore = 0;
    if (post.date) {
      const postDate = new Date(post.date);
      const daysDifference = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDifference <= RECENCY_TIMEFRAME_DAYS) {
        recencyScore = RECENCY_MAX_SCORE * (1 - daysDifference / RECENCY_TIMEFRAME_DAYS);
      }
    }
    
    // Calculate weighted scores
    const weightedTextScore = textScore * TEXT_MATCH_WEIGHT;
    const weightedTagScore = tagScore * TAG_WEIGHT;    // All posts get a baseline score from recency, plus any matching scores
    // This ensures all posts are returned and ranked meaningfully
    const totalScore = weightedTextScore + weightedTagScore + recencyScore;
    
    return {
      ...post,
      _relevanceScore: totalScore,
      _textScore: textScore,
      _tagScore: tagScore,
      _recencyScore: recencyScore
    };
  }).sort((a, b) => b._relevanceScore - a._relevanceScore)    .map(post => {
      // Remove internal scoring properties before returning
      const { _relevanceScore, _textScore, _tagScore, _recencyScore, ...cleanPost } = post;
      return cleanPost;
    });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename while preserving extension
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, and PowerPoint files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// API Routes

// Blog Posts Routes

// Get all posts with optional search/filter
app.get('/api/posts', (req, res) => {
  try {
    const { query, tags, mode = 'all' } = req.query;
    const allPosts = getAllPosts();
    
    let tagsArray = [];
    if (tags) {
      tagsArray = Array.isArray(tags) ? tags : [tags];
    }

    const filteredPosts = searchPosts(allPosts, query, tagsArray, mode);
    
    res.json({
      posts: filteredPosts,
      total: filteredPosts.length,
      searchInfo: {
        mode,
        query: query || '',
        tags: tagsArray
      }
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});

// Get a single post by ID
app.get('/api/posts/:id', (req, res) => {
  try {
    const postId = req.params.id;
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ error: 'Failed to retrieve post' });
  }
});

// Create a new post
app.post('/api/posts', (req, res) => {
  try {
    const postData = req.body;
    
    // Validate required fields
    if (!postData.title || !postData.content || !postData.author) {
      return res.status(400).json({ error: 'Missing required fields: title, content, author' });
    }
    
    // Generate ID if not provided
    if (!postData.id) {
      postData.id = postData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
    }
    
    // Set default date if not provided
    if (!postData.date) {
      postData.date = new Date().toISOString().split('T')[0];
    }
    
    // Ensure tags is an array
    if (!postData.tags) {
      postData.tags = [];
    }
    
    // Ensure attachments is an array
    if (!postData.attachments) {
      postData.attachments = [];
    }
    
    const success = savePost(postData);
    
    if (success) {
      // Update manifest file
      addPostToManifest(postData.id);
      
      res.status(201).json(postData);
    } else {
      res.status(500).json({ error: 'Failed to save post' });
    }
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update an existing post
app.put('/api/posts/:id', (req, res) => {
  try {
    const oldPostId = req.params.id;
    const postData = req.body;
    
    // Validate required fields
    if (!postData.title || !postData.content || !postData.author) {
      return res.status(400).json({ error: 'Missing required fields: title, content, author' });
    }
    
    // Create backup before updating
    createBackup(oldPostId);
    
    // Generate new ID based on title (same logic as frontend)
    const newPostId = postData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Use the new ID for the post
    postData.id = newPostId;
    
    // If the ID has changed, we need to delete the old file
    if (oldPostId !== newPostId) {
      const oldFilePath = path.join(postsDir, `${oldPostId}.json`);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old post file: ${oldPostId}.json`);
          
          // Delete old file from FTP asynchronously
          const oldRemotePath = `${FTP_CONFIG.remoteBasePath}/posts/${oldPostId}.json`;
          deleteFromFTP(oldRemotePath).catch(error => {
            console.error(`Failed to delete old post ${oldPostId} from FTP:`, error);
          });
        } catch (deleteError) {
          console.error('Error deleting old post file:', deleteError);
          // Continue with the update even if deletion fails
        }
      }
      
      // Update manifest file for ID change
      updateManifestForIdChange(oldPostId, newPostId);
    }
    
    const success = savePost(postData);
    
    if (success) {
      console.log(`Post updated successfully: ${oldPostId} -> ${newPostId}`);
      res.json(postData);
    } else {
      res.status(500).json({ error: 'Failed to update post' });
    }
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
app.delete('/api/posts/:id', (req, res) => {
  try {
    const postId = req.params.id;
    const success = deletePost(postId);
    
    if (success) {
      // Remove from manifest
      removePostFromManifest(postId);
      
      res.json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get all unique tags
app.get('/api/tags', (req, res) => {
  try {
    const posts = getAllPosts();
    const allTags = posts.reduce((tags, post) => {
      if (post.tags) {
        tags.push(...post.tags);
      }
      return tags;
    }, []);
    
    const uniqueTags = [...new Set(allTags)].sort();
    res.json(uniqueTags);
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ error: 'Failed to retrieve tags' });
  }
});

// Upload files
app.post('/api/attachments/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const attachments = req.files.map(file => ({
      id: uuidv4(),
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      filename: file.filename, // Server filename
      uploadDate: new Date().toISOString()
    }));

    // Sync uploaded files to FTP asynchronously
    req.files.forEach(file => {
      syncAttachmentToFTP(file.filename).catch(error => {
        console.error(`Failed to sync attachment ${file.filename} to FTP:`, error);
      });
    });

    res.json({ attachments });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Download file
app.get('/api/attachments/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats for metadata
    const stats = fs.statSync(filePath);
    
    // Send file
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// View file (for browser viewing without download)
app.get('/api/attachments/view/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats and determine content type
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    // Set appropriate content type for viewing
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.doc') {
      contentType = 'application/msword';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === '.ppt') {
      contentType = 'application/vnd.ms-powerpoint';
    } else if (ext === '.pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }

    // Set headers for viewing (not downloading)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'inline'); // 'inline' for viewing, 'attachment' for download
    
    // Send file for viewing
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('View error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to view file' });
        }
      }
    });
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'Failed to view file' });
  }
});

// Delete file
app.delete('/api/attachments/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file locally
    fs.unlinkSync(filePath);
    
    // Delete from FTP asynchronously
    const remotePath = `${FTP_CONFIG.remoteBasePath}/uploads/${filename}`;
    deleteFromFTP(remotePath).catch(error => {
      console.error(`Failed to delete attachment ${filename} from FTP:`, error);
    });
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file info
app.get('/api/attachments/info/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    res.json({
      exists: true,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// FTP sync endpoint - manually sync all data to FTP
app.post('/api/sync-ftp', async (req, res) => {
  try {
    console.log('Starting manual FTP sync...');
    
    // Sync all posts
    const posts = getAllPosts();
    let postsSynced = 0;
    for (const post of posts) {
      const success = await syncPostToFTP(post.id);
      if (success) postsSynced++;
    }
    
    // Sync manifest
    const manifestSynced = await syncManifestToFTP();
    
    // Sync all uploads
    let uploadsSynced = 0;
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const success = await syncAttachmentToFTP(file);
        if (success) uploadsSynced++;
      }
    }
    
    res.json({
      success: true,
      message: 'FTP sync completed',
      results: {
        posts: `${postsSynced}/${posts.length}`,
        manifest: manifestSynced,
        uploads: `${uploadsSynced}/${fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0}`
      }
    });
  } catch (error) {
    console.error('FTP sync error:', error);
    res.status(500).json({ error: 'Failed to sync to FTP', details: error.message });
  }
});

// FTP status check
app.get('/api/ftp-status', async (req, res) => {
  const client = new FTPClient();
  try {
    await client.access(FTP_CONFIG);
    await client.list('/');
    res.json({ 
      connected: true, 
      message: 'FTP connection successful',
      config: {
        host: FTP_CONFIG.host,
        user: FTP_CONFIG.user,
        port: FTP_CONFIG.port,
        remoteBasePath: FTP_CONFIG.remoteBasePath
      }
    });
  } catch (error) {
    res.json({ 
      connected: false, 
      message: 'FTP connection failed', 
      error: error.message,
      config: {
        host: FTP_CONFIG.host,
        user: FTP_CONFIG.user,
        port: FTP_CONFIG.port,
        remoteBasePath: FTP_CONFIG.remoteBasePath
      }
    });
  } finally {
    client.close();
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }
  
  if (error.message === 'Invalid file type. Only PDF, Word, and PowerPoint files are allowed.') {
    return res.status(400).json({ error: error.message });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Posts directory: ${postsDir}`);
  console.log(`Manifest file: ${manifestPath}`);
  console.log('Files will be written to public/data/ for FTP deployment');
  
  // Log FTP configuration
  console.log('\nFTP Configuration:');
  console.log(`Host: ${FTP_CONFIG.host}`);
  console.log(`User: ${FTP_CONFIG.user}`);
  console.log(`Port: ${FTP_CONFIG.port}`);
  console.log(`Remote Path: ${FTP_CONFIG.remoteBasePath}`);
  console.log('Note: Set FTP environment variables for automatic sync');
  
  // Log current file structure
  console.log('\nCurrent data structure:');
  try {
    if (fs.existsSync(postsDir)) {
      const posts = fs.readdirSync(postsDir);
      console.log(`Posts: ${posts.length} files`);
    }
    if (fs.existsSync(uploadsDir)) {
      const uploads = fs.readdirSync(uploadsDir);
      console.log(`Uploads: ${uploads.length} files`);
    }
    if (fs.existsSync(manifestPath)) {
      console.log('Manifest: exists');
    } else {
      console.log('Manifest: will be created');
    }
  } catch (err) {
    console.log('Error reading directories:', err.message);
  }
  
  console.log('\nAPI Endpoints:');
  console.log('- POST /api/sync-ftp - Manual FTP sync');
  console.log('- GET /api/ftp-status - Check FTP connection');
});
