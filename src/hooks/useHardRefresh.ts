import { useEffect } from 'react';

/**
 * Custom hook to handle hard refresh with cache clearing
 * Listens for Ctrl+Shift+R (or Cmd+Shift+R on Mac) keyboard shortcut
 */
export function useHardRefresh() {
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+R (or Cmd+Shift+R on Mac)
      const isHardRefreshShortcut = 
        (event.ctrlKey || event.metaKey) && 
        event.shiftKey && 
        event.key.toLowerCase() === 'r';

      if (isHardRefreshShortcut) {
        event.preventDefault();
        
        try {
          // Clear cache for manifest and post files
          if ('caches' in window) {
            alert("Clearing Cache")
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }

          // Clear Service Worker cache if present
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(
              registrations.map(registration => registration.unregister())
            );
          }

          // Force reload with cache bypass
          window.location.reload();
        } catch (error) {
  
          console.error('Error during hard refresh:', error);
          // Fallback: just do a regular hard reload
          window.location.reload();
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
}
