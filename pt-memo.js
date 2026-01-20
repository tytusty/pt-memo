/**
 * Robust Component Initializer for Swup/AJAX Transitions
 * Solves the "Uncaught ReferenceError" problem by waiting for class definitions.
 */

(function() {
    'use strict';

    // CONFIGURATION: Add your component class names here
    const COMPONENTS = [
        'next_infinite_slider', // e.g., your custom slider
        'bc_split_button',      // e.g., an animated button
        'marquee',
        'maskbutton',
        'bcexpander'
        // Add more as needed
    ];

    const MAX_WAIT_TIME_MS = 3000; // Stop checking after 3 seconds
    const CHECK_INTERVAL_MS = 100; // How often to check (100ms)

    /**
     * Waits for a single component class to become available and then initializes it.
     * @param {string} componentName - The name of the class (e.g., 'MySlider').
     */
    function waitAndInitComponent(componentName) {
        const startTime = Date.now();

        function check() {
            // SUCCESS: Class is now available on the global window object
            if (window[componentName] && typeof window[componentName] === 'function') {
                try {
                    new window[componentName](); // Instantiate it
                    console.log(`✅ ${componentName} initialized (after ${Date.now() - startTime}ms)`);
                } catch (error) {
                    console.warn(`⚠ ${componentName} instantiation failed:`, error.message);
                }
                return; // Exit, our job is done
            }

            // TIMEOUT: We've waited too long, give up gracefully.
            if (Date.now() - startTime > MAX_WAIT_TIME_MS) {
                console.log(`⏭ ${componentName} not found after ${MAX_WAIT_TIME_MS}ms. Skipping.`);
                return;
            }

            // NOT YET: Try again after a short delay.
            setTimeout(check, CHECK_INTERVAL_MS);
        }

        check(); // Start the checking cycle
    }

    /**
     * Main initialization function. Kicks off the process for all components.
     */
    function initAllComponents() {
        console.log('🔄 Component initialization started.');
        COMPONENTS.forEach(waitAndInitComponent);
    }

    // --- EXECUTION & SWUP INTEGRATION ---

    // 1. INITIAL LOAD: Run when the page first loads.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllComponents);
    } else {
        // DOM is already ready
        initAllComponents();
    }

    // 2. SWUP INTEGRATION: Re-initialize after every page navigation.
    //    Waits for Swup to be available and attaches listeners.
    const swupCheckInterval = setInterval(() => {
        if (window.swup) { // Assumes the Swup instance is globally accessible as `swup`
            clearInterval(swupCheckInterval);
            console.log('✅ Swup instance found. Attaching lifecycle hooks.');

            // Hook into Swup's main lifecycle events
            window.swup.hooks.on('page:view', () => {
                // Small delay to ensure DOM is ready for interaction
                setTimeout(initAllComponents, 100);
            });

            // For Swup 4: 'content:replace' is a key moment right after new HTML is inserted.
            window.swup.hooks.on('content:replace', () => {
                // Minimal delay to let the DOM settle
                setTimeout(initAllComponents, 10);
            });

        }
        // Safety timeout: Stop checking if Swup isn't loaded after 10 sec.
    }, 100);
    setTimeout(() => clearInterval(swupCheckInterval), 10000);

})();
