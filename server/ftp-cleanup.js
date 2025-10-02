import 'dotenv/config';
import ftp from 'basic-ftp';

const FTP_CONFIG = {
    host: process.env.FTP_HOST?.replace(/^ftp:\/\//, ''),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    remoteBasePath: process.env.FTP_REMOTE_BASE_PATH || '/domains/lexaashraya.in/public_html'
};

console.log('🧹 FTP Cleanup Script');
console.log('═'.repeat(60));
console.log(`Host: ${FTP_CONFIG.host}`);
console.log(`Remote Base Path: ${FTP_CONFIG.remoteBasePath}`);
console.log('');

async function cleanupTestFiles() {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    
    try {
        console.log('🔄 Connecting to FTP server...');
        await client.access({
            host: FTP_CONFIG.host,
            user: FTP_CONFIG.user,
            password: FTP_CONFIG.password,
            secure: false
        });
        
        console.log('✅ Connected to FTP server');
        console.log('');
        
        // Clean up any test files in the remote base path
        const testFiles = ['test.txt', 'ftp-test.txt', 'cleanup-test.txt'];
        
        for (const testFile of testFiles) {
            try {
                const filePath = `${FTP_CONFIG.remoteBasePath}/${testFile}`.replace('//', '/');
                await client.remove(filePath);
                console.log(`🗑️  Removed: ${filePath}`);
            } catch (error) {
                // File might not exist, which is fine
                console.log(`ℹ️  File not found (already clean): ${testFile}`);
            }
        }
        
        // Clean up test files in data directory if it exists
        try {
            const dataPath = `${FTP_CONFIG.remoteBasePath}/data`.replace('//', '/');
            for (const testFile of testFiles) {
                try {
                    const filePath = `${dataPath}/${testFile}`;
                    await client.remove(filePath);
                    console.log(`🗑️  Removed: ${filePath}`);
                } catch (error) {
                    // File might not exist, which is fine
                }
            }
        } catch (error) {
            console.log('ℹ️  Data directory not accessible or doesn\'t exist');
        }
        
        console.log('');
        console.log('✅ Cleanup completed!');
        
    } catch (error) {
        console.error('❌ FTP cleanup failed:', error.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

cleanupTestFiles().catch(console.error);