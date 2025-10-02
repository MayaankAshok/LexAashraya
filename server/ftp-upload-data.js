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
  remoteBasePath: process.env.FTP_REMOTE_BASE_PATH || '/domains/lexaashraya.in/public_html',
  remoteDataPath: `${process.env.FTP_REMOTE_BASE_PATH || '/domains/lexaashraya.in/public_html'}/data`
};

// Local data directory
const localDataDir = path.join(__dirname, '../public/data');

async function uploadDataToFTP() {
  const client = new FTPClient();
  
  try {
    console.log('📡 Connecting to FTP server...');
    console.log(`🌐 Host: ${FTP_CONFIG.host}`);
    console.log(`👤 User: ${FTP_CONFIG.user}`);
    console.log(`📁 Local data dir: ${localDataDir}`);
    console.log(`📁 Remote data path: ${FTP_CONFIG.remoteDataPath}`);
    
    await client.access(FTP_CONFIG);
    console.log('✅ Connected to FTP server successfully\n');
    
    // Check if local data directory exists
    if (!fs.existsSync(localDataDir)) {
      console.log('❌ Local data directory does not exist:', localDataDir);
      return;
    }
    
    // Ensure remote data directory exists
    try {
      await client.ensureDir(FTP_CONFIG.remoteDataPath);
      console.log(`📁 Ensured remote directory exists: ${FTP_CONFIG.remoteDataPath}`);
    } catch (error) {
      console.log(`⚠️  Could not create remote directory: ${error.message}`);
    }
    
    console.log('\n🚀 Starting data upload...\n');
    
    // Upload the entire data directory
    await client.uploadFromDir(localDataDir, FTP_CONFIG.remoteDataPath);
    
    console.log('\n Data upload completed hi successfully!');
    
    // List remote directory to confirm upload
    console.log('\n 📋 Remote directory listing:');
    const remoteFiles = await client.list(FTP_CONFIG.remoteDataPath);
    remoteFiles.forEach(file => {
      const icon = file.isDirectory ? '📁' : '📄';
      const size = file.isDirectory ? '' : ` (${file.size} bytes)`;
      console.log(`${icon} ${file.name}${size}`);
    });
    
    // Count and display statistics
    console.log('\n📊 Upload Statistics:');
    
    // Count local files for comparison
    let localFileCount = 0;
    let localDirCount = 0;
    
    function countLocalFiles(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          localDirCount++;
          countLocalFiles(path.join(dir, item.name));
        } else {
          localFileCount++;
        }
      }
    }
    
    countLocalFiles(localDataDir);
    
    console.log(`📄 Local files: ${localFileCount}`);
    console.log(`📁 Local directories: ${localDirCount}`);
    console.log(`📡 Remote items listed: ${remoteFiles.length}`);
    
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
  console.log('🔧 FTP Data Upload Script');
  console.log('=' .repeat(50));
  
  uploadDataToFTP()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

export { uploadDataToFTP };
