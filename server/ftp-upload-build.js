import { Client as FTPClient } from 'basic-ftp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FTP Configuration
const FTP_CONFIG = {
  host: process.env.FTP_HOST?.replace(/^ftp:\/\//, '') || 'your-domain.com',
  user: process.env.FTP_USER || 'your-username',
  password: process.env.FTP_PASSWORD || 'your-password',
  port: parseInt(process.env.FTP_PORT) || 21,
  secure: false, // Set to true if using FTPS
  // Build artifacts go to public_html (parent of data folder)
  remoteBasePath: (process.env.FTP_REMOTE_BASE_PATH || '/domains/lexaashraya.in/public_html/data').replace('/data', '')
};

// Build directories
const staticBuildDir = path.join(__dirname, '../dist-static');

async function uploadBuildToFTP() {
  const client = new FTPClient();
  
  try {
    console.log('📡 Connecting to FTP server...');
    console.log(`🌐 Host: ${FTP_CONFIG.host}`);
    console.log(`👤 User: ${FTP_CONFIG.user}`);
    console.log(`📁 Static build dir: ${staticBuildDir}`);
    console.log(`📁 Remote base path: ${FTP_CONFIG.remoteBasePath}`);
    
    await client.access(FTP_CONFIG);
    console.log('✅ Connected to FTP server successfully\n');
    
    let uploadCount = 0;
    
    // Upload static build to base path (main website)
    if (fs.existsSync(staticBuildDir)) {
      console.log('🚀 Uploading static build files to base path...\n');
      
      // Ensure base directory exists
      try {
        await client.ensureDir(FTP_CONFIG.remoteBasePath);
        console.log(`📁 Ensured remote directory exists: ${FTP_CONFIG.remoteBasePath}`);
      } catch (error) {
        console.log(`⚠️  Could not create remote directory: ${error.message}`);
      }
      
      // Upload static files to base path, excluding the data folder
      console.log('📤 Uploading files (excluding data folder)...');
      const items = fs.readdirSync(staticBuildDir);
      
      for (const item of items) {
        // Skip the data folder - it's managed separately
        if (item === 'data') {
          console.log(`⏭️  Skipping data folder`);
          continue;
        }
        
        const itemPath = path.join(staticBuildDir, item);
        const remotePath = path.posix.join(FTP_CONFIG.remoteBasePath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          console.log(`📁 Uploading directory: ${item}`);
          await client.uploadFromDir(itemPath, remotePath);
        } else {
          console.log(`📄 Uploading file: ${item}`);
          await client.uploadFrom(itemPath, remotePath);
        }
      }
      
      uploadCount++;
      console.log('✅ Static build uploaded successfully!\n');
    } else {
      console.log('⚠️  Static build directory not found, skipping...\n');
    }
    
    if (uploadCount === 0) {
      console.log('❌ No static build directory found to upload');
      console.log('💡 Run "npm run build" to generate build files first');
      return;
    }
    
    // List remote directory to confirm upload
    console.log('📋 Remote directory listing:');
    const remoteFiles = await client.list(FTP_CONFIG.remoteBasePath);
    remoteFiles.forEach(file => {
      const icon = file.isDirectory ? '📁' : '📄';
      const size = file.isDirectory ? '' : ` (${(file.size / 1024).toFixed(1)}KB)`;
      console.log(`${icon} ${file.name}${size}`);
    });
    
    console.log('\n📊 Upload Statistics:');
    console.log(`📦 Static build uploaded: ${uploadCount > 0 ? 'Yes' : 'No'}`);
    console.log(`📡 Remote files in base path: ${remoteFiles.length}`);
    
  } catch (error) {
    console.error('❌ FTP Upload Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Check your FTP host configuration');
    } else if (error.code === 530) {
      console.error('💡 Check your FTP username and password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Check your FTP port and firewall settings');
    }
  } finally {
    client.close();
    console.log('\n🔌 FTP connection closed');
  }
}

// Run the upload if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('🔧 FTP Build Upload Script');
  console.log('=' .repeat(50));
  
  uploadBuildToFTP()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

export { uploadBuildToFTP };
