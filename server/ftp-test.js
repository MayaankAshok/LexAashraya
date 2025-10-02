import 'dotenv/config';
import ftp from 'basic-ftp';

const FTP_CONFIG = {
    host: process.env.FTP_HOST?.replace(/^ftp:\/\//, ''), // Remove ftp:// protocol if present
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    remoteBasePath: process.env.FTP_REMOTE_BASE_PATH || '/domains/lexaashraya.in/public_html'
};

console.log('FTP Configuration:');
console.log(`Host: ${FTP_CONFIG.host}`);
console.log(`User: ${FTP_CONFIG.user}`);
console.log(`Remote Base Path: ${FTP_CONFIG.remoteBasePath}`);
console.log('');

async function testFTPConnection() {
    const client = new ftp.Client();
    client.ftp.verbose = false; // Disable verbose logging
    
    try {
        console.log('🔄 Connecting to FTP server...');
        await client.access({
            host: FTP_CONFIG.host,
            user: FTP_CONFIG.user,
            password: FTP_CONFIG.password,
            secure: false
        });
        
        console.log('✅ Successfully connected to FTP server!');
        console.log('');
        
        // List files in root directory
        console.log('📁 Listing files in root directory (/)...');
        console.log('─'.repeat(60));
        const rootFiles = await client.list('/');
        if (rootFiles.length === 0) {
            console.log('(No files found in root directory)');
        } else {
            rootFiles.forEach(file => {
                const type = file.isDirectory ? '📁 DIR ' : '📄 FILE';
                const size = file.isDirectory ? '' : ` (${file.size} bytes)`;
                console.log(`${type} ${file.name}${size}`);
            });
        }
        console.log('');
        
        // List files in public_html if it exists
        try {
            console.log('📁 Listing files in /public_html...');
            console.log('─'.repeat(60));
            const publicHtmlFiles = await client.list('/public_html');
            if (publicHtmlFiles.length === 0) {
                console.log('(No files found in /public_html)');
            } else {
                publicHtmlFiles.forEach(file => {
                    const type = file.isDirectory ? '📁 DIR ' : '📄 FILE';
                    const size = file.isDirectory ? '' : ` (${file.size} bytes)`;
                    console.log(`${type} ${file.name}${size}`);
                });
            }
            console.log('');
        } catch (error) {
            console.log('❌ /public_html directory not found or inaccessible');
            console.log('');
        }
        
        // List files in the configured remote base path
        if (FTP_CONFIG.remoteBasePath !== '/') {
            try {
                console.log(`📁 Listing files in ${FTP_CONFIG.remoteBasePath}...`);
                console.log('─'.repeat(60));
                const basePathFiles = await client.list(FTP_CONFIG.remoteBasePath);
                if (basePathFiles.length === 0) {
                    console.log(`(No files found in ${FTP_CONFIG.remoteBasePath})`);
                } else {
                    basePathFiles.forEach(file => {
                        const type = file.isDirectory ? '📁 DIR ' : '📄 FILE';
                        const size = file.isDirectory ? '' : ` (${file.size} bytes)`;
                        console.log(`${type} ${file.name}${size}`);
                    });
                }
                console.log('');
            } catch (error) {
                console.log(`❌ ${FTP_CONFIG.remoteBasePath} directory not found or inaccessible`);
                console.log('');
            }
        }
        
        // Check if data directory exists within the base path
        try {
            const dataPath = `${FTP_CONFIG.remoteBasePath}/data`.replace('//', '/');
            console.log(`📁 Listing files in ${dataPath}...`);
            console.log('─'.repeat(60));
            const dataFiles = await client.list(dataPath);
            if (dataFiles.length === 0) {
                console.log(`(No files found in ${dataPath})`);
            } else {
                dataFiles.forEach(file => {
                    const type = file.isDirectory ? '📁 DIR ' : '📄 FILE';
                    const size = file.isDirectory ? '' : ` (${file.size} bytes)`;
                    console.log(`${type} ${file.name}${size}`);
                });
            }
            console.log('');
        } catch (error) {
            console.log(`❌ ${FTP_CONFIG.remoteBasePath}/data directory not found or inaccessible`);
            console.log('');
        }
        
        console.log('✅ FTP connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ FTP connection test failed:');
        console.error(`Error: ${error.message}`);
        console.error(`Code: ${error.code || 'Unknown'}`);
        
        if (error.message.includes('ENOTFOUND')) {
            console.error('💡 Tip: Check if the FTP host is correct and accessible');
        } else if (error.message.includes('530')) {
            console.error('💡 Tip: Check FTP username and password');
        }
        
        process.exit(1);
    } finally {
        client.close();
    }
}

// Run the test
console.log('🧪 FTP Connection and File Listing Test');
console.log('═'.repeat(60));
console.log('');

testFTPConnection().catch(console.error);