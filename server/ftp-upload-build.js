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
  host: process.env.FTP_HOST?.replace('ftp://', '') || 'your-domain.com',
  user: process.env.FTP_USER || 'your-username',
  password: process.env.FTP_PASSWORD || 'your-password',
  port: parseInt(process.env.FTP_PORT) || 21,
  secure: false, // Set to true if using FTPS
  remoteBasePath: '/' // Root of your website directory
};

// Build directories
const staticBuildDir = path.join(__dirname, '../dist-static');
const adminBuildDir = path.join(__dirname, '../dist-admin');

async function uploadBuildToFTP() {
  const client = new FTPClient();
  
  try {
    console.log('📡 Connecting to FTP server...');
    console.log(`🌐 Host: ${FTP_CONFIG.host}`);
    console.log(`👤 User: ${FTP_CONFIG.user}`);
    console.log(`📁 Static build dir: ${staticBuildDir}`);
    console.log(`📁 Admin build dir: ${adminBuildDir}`);
    console.log(`📁 Remote base path: ${FTP_CONFIG.remoteBasePath}`);
    
    await client.access(FTP_CONFIG);
    console.log('✅ Connected to FTP server successfully\n');
    
    let uploadCount = 0;
    
    // Upload static build (main website)
    if (fs.existsSync(staticBuildDir)) {
      console.log('🚀 Uploading static build files...\n');
      
      // Ensure root directory exists
      try {
        await client.ensureDir(FTP_CONFIG.remoteBasePath);
        console.log(`📁 Ensured remote directory exists: ${FTP_CONFIG.remoteBasePath}`);
      } catch (error) {
        console.log(`⚠️  Could not create remote directory: ${error.message}`);
      }
      
      // Upload static files to root
      await client.uploadFromDir(staticBuildDir, FTP_CONFIG.remoteBasePath);
      uploadCount++;
      console.log('✅ Static build uploaded successfully!\n');
    } else {
      console.log('⚠️  Static build directory not found, skipping...\n');
    }
    
    // Upload admin build to /admin subdirectory
    if (fs.existsSync(adminBuildDir)) {
      console.log('🔐 Uploading admin build files...\n');
      
      const adminRemotePath = path.posix.join(FTP_CONFIG.remoteBasePath, 'admin');
      
      // Ensure admin directory exists
      try {
        await client.ensureDir(adminRemotePath);
        console.log(`📁 Ensured remote admin directory exists: ${adminRemotePath}`);
      } catch (error) {
        console.log(`⚠️  Could not create remote admin directory: ${error.message}`);
      }
      
      // Upload admin files to /admin
      await client.uploadFromDir(adminBuildDir, adminRemotePath);
      uploadCount++;
      console.log('✅ Admin build uploaded successfully!\n');
    } else {
      console.log('⚠️  Admin build directory not found, skipping...\n');
    }
    
    if (uploadCount === 0) {
      console.log('❌ No build directories found to upload');
      console.log('💡 Run "npm run build" to generate build files first');
      return;
    }
    
    // List remote directory to confirm upload
    console.log('📋 Remote directory listing (root):');
    const remoteFiles = await client.list(FTP_CONFIG.remoteBasePath);
    remoteFiles.forEach(file => {
      const icon = file.isDirectory ? '📁' : '📄';
      const size = file.isDirectory ? '' : ` (${(file.size / 1024).toFixed(1)}KB)`;
      console.log(`${icon} ${file.name}${size}`);
    });
    
    // Check admin directory if it exists
    try {
      const adminRemotePath = path.posix.join(FTP_CONFIG.remoteBasePath, 'admin');
      const adminFiles = await client.list(adminRemotePath);
      if (adminFiles.length > 0) {
        console.log('\n📋 Remote directory listing (admin):');
        adminFiles.forEach(file => {
          const icon = file.isDirectory ? '📁' : '📄';
          const size = file.isDirectory ? '' : ` (${(file.size / 1024).toFixed(1)}KB)`;
          console.log(`${icon} ${file.name}${size}`);
        });
      }
    } catch (error) {
      // Admin directory might not exist, which is fine
    }
    
    console.log('\n📊 Upload Statistics:');
    console.log(`📦 Build directories uploaded: ${uploadCount}`);
    console.log(`📡 Remote files in root: ${remoteFiles.length}`);
    
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
if (import.meta.url === `file://${process.argv[1]}`) {
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
