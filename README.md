# 🛠️ The Ultimate Guide: Fixing JavaScript Components Broken by Swup/AJAX Transitions

So, your cool interactive components (sliders, animated buttons, etc.) work on the first page load but **break or disappear after clicking a link** in your Swup-powered single-page application (SPA)? You're not alone. This is one of the most common headaches when setting up page transitions.

Let's break down **why this happens** and implement a **robust solution** that won't let you down.

### 🔍 The Root of the Problem: "Vanishing" JavaScript

When you use **Swup, Barba.js, or similar page transition libraries**, the browser doesn't perform a full page refresh. Instead, these libraries fetch the new page via AJAX and surgically swap the main content in your `<div id="swup">` container.

Here’s the **critical catch**: While the new HTML is inserted, the `<script>` tags that **define** your custom component classes (like `class MySlider {...}`) are often in the `<head>` or at the end of the `<body>`. These definitions are **not automatically re-executed** when the new content loads.

Your initialization script (which likely runs on `DOMContentLoaded` or Swup's `content:replace` hook) tries to create new instances (`new MySlider()`). But at that exact moment, `MySlider` is **undefined** in the global scope (`window`), leading to the infamous error:
`Uncaught ReferenceError: MySlider is not defined`

### 💡 The Key Insight: It's About Timing & Assurance

The simple fix of running your `init()` function inside Swup's hooks (`page:view`) is a good start, but it's **not enough**. It assumes your classes are already available, which they often are not.

**The robust solution is a two-part strategy:**

1.  **Hook Correctly**: Execute your init logic at the right point in Swup's lifecycle.
2.  **Wait & Verify**: For each component, **actively wait and check** if its class is available on the `window` object before attempting to instantiate it. Never assume.

---

### ✅ The Robust Solution: Code Implementation

Below is a production-ready script that implements this "wait-and-check" pattern. It's framework-agnostic and will work with Swup or any similar AJAX navigation system.

```javascript
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
```

### 🚀 How to Use This Script

1.  **Placement**: Insert this script **after** the `<script>` tags that define your components (e.g., `slider.js`, `buttons.js`) but **before** the closing `</body>` tag.
2.  **Configuration**: Edit the `COMPONENTS` array at the top, adding the exact names of your component classes.
3.  **Swup Instance**: The script looks for `window.swup`. If your Swup instance has a different global name (e.g., `window.mySwup`), update the `if (window.swup)` check accordingly.
4.  **Debug**: Open your browser's console (`F12`). You will see detailed logs for each component's status, which is invaluable for debugging.

---

### 🗣️ How to Ask for Help (A Template for AI or Forums)

If you're still stuck, using clear terminology will get you better help faster. Here’s a great way to frame your question:

> "I'm implementing AJAX page transitions with Swup on my site. My custom JavaScript components (like sliders and animated buttons) initialize correctly on the first page load but **fail to run after navigation**. I'm calling my initialization function within Swup's `page:view` and `content:replace` hooks, but I keep getting `Uncaught ReferenceError: [ComponentClass] is not defined` errors.
>
> It seems the `<script>` files defining my component classes are not being re-evaluated in the new page content fetched by Swup. I need a reliable pattern to **make my initialization script wait for these class definitions to become available** on the `window` object before attempting to instantiate them. Can you help me implement a `waitForComponent()`-style solution?"

This explanation immediately guides any helper (human or AI) towards the core architectural issue and the "wait-and-check" pattern that solves it.

By implementing this pattern, you move from a fragile, timing-dependent setup to a **resilient system** that ensures your components work seamlessly, no matter the network speed or script loading order. Happy coding
