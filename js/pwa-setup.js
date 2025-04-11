'use strict';

/**
 * Sets up PWA functionality - service worker registration and installation prompts
 * @param {Object} dom - DOM elements object
 * @returns {Function} Function that handles install prompt
 */
export const setupPWA = (dom) => {
    let deferredPrompt; // Store the deferred prompt for later use

    // Hide button initially (ensures it's hidden even if CSS doesn't load)
    if (dom.installPwaButton) {
        dom.installPwaButton.style.display = 'none';
    }

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('./js/service-worker.js');
                console.log('ServiceWorker registration successful with scope:', registration.scope);
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        // Store the event for later use
        deferredPrompt = e;
        // Make the install button visible
        if (dom.installPwaButton) {
            dom.installPwaButton.style.display = 'block';
        }
    });

    // Track installation
    window.addEventListener('appinstalled', () => {
        // Hide the install button after successful installation
        if (dom.installPwaButton) {
            dom.installPwaButton.style.display = 'none';
        }
        // Clear the deferred prompt
        deferredPrompt = null;
    });

    // Return a function that handles the install prompt
    return async () => {
        if (!deferredPrompt) {
            return null;
        }

        // Disable the button during the prompt
        dom.installPwaButton.disabled = true;

        try {
            // Show the prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            await deferredPrompt.userChoice;
        } catch (error) {
            console.error('Error showing install prompt:', error);
        } finally {
            // Re-enable the button
            dom.installPwaButton.disabled = false;
        }
        
        return null; // Return null to indicate deferredPrompt has been used
    };
};
