import { Client as FTPClient } from 'basic-ftp';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FTP Configuration
const FTP_CONFIG = {
  host: process.env.FTP_HOST?.replace('ftp://', '') || 'your-domain.com',
  user: process.env.FTP_USER || 'your-username',
  password: process.env.FTP_PASSWORD || 'your-password',
  port: parseInt(process.env.FTP_PORT) || 21,
  secure: false,
  remoteBasePath: '/data' // Remote data folder path
};

// Local paths
const localDataDir = path.join(__dirname, '../public/data');

async function downloadDataFromFTP() {
  const client = new FTPClient();
  
  try {
    console.log('🔗 Connecting to FTP server...');
    await client.access(FTP_CONFIG);
    console.log('✅ Connected to FTP server');
    
    // Create local data directory if it doesn't exist
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
      console.log('📁 Created local data directory');
    }
    
    // Check if remote data directory exists
    try {
      await client.list(FTP_CONFIG.remoteBasePath);
      console.log(`📂 Found remote data directory: ${FTP_CONFIG.remoteBasePath}`);
    } catch (error) {
      console.error(`❌ Remote data directory not found: ${FTP_CONFIG.remoteBasePath}`);
      console.error('Make sure the remote path exists or check your FTP configuration');
      return false;
    }
    
    // Download entire data directory
    console.log(`⬇️  Downloading remote data folder to local...`);
    await client.downloadToDir(localDataDir, FTP_CONFIG.remoteBasePath);
    console.log(`✅ Data folder downloaded successfully!`);
    
    // List what was downloaded
    console.log('\n📋 Downloaded contents:');
    listDirectoryContents(localDataDir, '');
    
    return true;
    
  } catch (error) {
    console.error('❌ FTP Download Error:', error.message);
    return false;
  } finally {
    client.close();
    console.log('🔌 FTP connection closed');
  }
}

function listDirectoryContents(dir, indent) {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        console.log(`${indent}📁 ${item}/`);
        listDirectoryContents(itemPath, indent + '  ');
      } else {
        const size = (stats.size / 1024).toFixed(1);
        console.log(`${indent}📄 ${item} (${size} KB)`);
      }
    });
  } catch (error) {
    console.error(`Error listing directory ${dir}:`, error.message);
  }
}

// Main execution
async function main() {
  console.log('🌐 FTP Data Download Script');
  console.log('============================');
  console.log(`Source: ${FTP_CONFIG.host}${FTP_CONFIG.remoteBasePath}`);
  console.log(`Target: ${localDataDir}`);
  console.log('');
  
  const success = await downloadDataFromFTP();
  
  if (success) {
    console.log('\n🎉 Download completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Download failed!');
    process.exit(1);
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
