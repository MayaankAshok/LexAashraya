import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    envDir: '.', // Look for .env files in the root directory
    build: {
      outDir: mode === 'admin' ? 'dist-admin' : 'dist-static',
      rollupOptions: {
        // Ensure different output directories for different builds
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
    },
    define: {
      // Make environment variables available at build time
      __BUILD_MODE__: JSON.stringify(mode),
      __ADMIN_ENABLED__: JSON.stringify(env.VITE_ADMIN_ENABLED === 'true')
    }
  }
})
