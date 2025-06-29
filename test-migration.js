// Simple test script to verify the Express server migration
import { BlogApiService } from '../src/services/blogApiService.js';

async function testServerMigration() {
  console.log('🧪 Testing Express Server Migration...\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing server health check...');
    const healthStatus = await BlogApiService.healthCheck();
    console.log('✅ Server is running:', healthStatus);
    
    // Test 2: Get All Posts
    console.log('\n2. Testing get all posts...');
    const postsResult = await BlogApiService.getAllPosts();
    console.log(`✅ Found ${postsResult.posts.length} posts`);
    
    // Test 3: Get Tags
    console.log('\n3. Testing get all tags...');
    const tags = await BlogApiService.getAllTags();
    console.log(`✅ Found ${tags.length} unique tags:`, tags.slice(0, 5));
    
    // Test 4: Search Posts
    console.log('\n4. Testing search functionality...');
    const searchResult = await BlogApiService.getAllPosts('law', undefined, 'keyword');
    console.log(`✅ Search found ${searchResult.posts.length} posts matching "law"`);
    
    console.log('\n🎉 All tests passed! Migration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the Express server is running:');
    console.log('   cd server && npm start');
  }
}

// Run the test
testServerMigration();
