/**
 * Development Script: Show All Mega Menus
 * This script makes all mega menus visible for development purposes only.
 * DO NOT USE IN PRODUCTION!
 */

console.log('🔧 DEV SCRIPT LOADING...');

// Simple immediate execution
(function () {
    'use strict';

    // Store containers globally
    let megaMenuContainers = [];

    // Add styles immediately
    const style = document.createElement('style');
    style.id = 'dev-mega-menu-styles';
    style.innerHTML = `
        /* Development styles for showing all menus */
        .mega-menu-container.dev-visible {
            position: relative !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            display: block !important;
            transform: none !important;
            margin-bottom: 2rem !important;
            border: 2px solid #e11d48 !important;
            border-radius: 8px !important;
        }
        
        .mega-menu-container.dev-visible::before {
            content: "DEV: " attr(data-mega-menu-container) " Menu";
            position: absolute;
            top: -10px;
            left: 10px;
            background: #e11d48;
            color: white;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 4px;
            z-index: 1000;
            text-transform: uppercase;
        }
        
        body {
            padding-top: 60px !important;
            padding-bottom: 100px !important;
        }
        
        .nav-item {
            background-color: #fef3c7 !important;
            border: 1px solid #f59e0b !important;
            margin: 2px !important;
        }
        
        #dev-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(45deg, #e11d48, #f59e0b);
            color: white;
            text-align: center;
            padding: 8px;
            font-weight: bold;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        #dev-toggle-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        #dev-toggle-btn:hover {
            background: rgba(255,255,255,0.3);
        }
    `;

    // Add styles to head immediately
    if (document.head) {
        document.head.appendChild(style);
        console.log('✅ DEV STYLES ADDED');
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            document.head.appendChild(style);
            console.log('✅ DEV STYLES ADDED (delayed)');
        });
    }

    // Global toggle function
    window.toggleDevMode = function () {
        console.log('🔄 TOGGLE CLICKED!');
        const statusSpan = document.getElementById('dev-status');

        // Check current state by looking at first container
        const isCurrentlyVisible = megaMenuContainers.length > 0 &&
            megaMenuContainers[0].classList.contains('dev-visible');

        if (isCurrentlyVisible) {
            // Hide all mega menus
            megaMenuContainers.forEach(container => {
                container.classList.remove('dev-visible');
                container.style.display = 'none';
                container.style.opacity = '0';
                container.style.pointerEvents = 'none';
                container.style.position = 'absolute';
            });
            if (statusSpan) statusSpan.textContent = 'Hidden';
            console.log('🔒 DEV MODE DISABLED - Menus hidden');
        } else {
            // Show all mega menus
            megaMenuContainers.forEach(container => {
                container.classList.add('dev-visible');
                container.style.display = 'block';
                container.style.opacity = '1';
                container.style.pointerEvents = 'auto';
                container.style.position = 'relative';
                container.style.transform = 'none';
                container.style.zIndex = '10';
                container.style.transition = 'none';
            });
            if (statusSpan) statusSpan.textContent = 'Visible';
            console.log('🔧 DEV MODE ENABLED - Menus visible');
        }
    };

    // Function to setup everything
    function setupDevMode() {
        console.log('🎯 SETTING UP DEV MODE...');

        // Find mega menu containers
        const containers = document.querySelectorAll('[data-mega-menu-container]');
        megaMenuContainers = Array.from(containers);
        console.log(`📋 Found ${containers.length} mega menu containers`);

        // Make them visible initially
        containers.forEach((container, index) => {
            const menuType = container.getAttribute('data-mega-menu-container');
            container.classList.add('dev-visible');
            container.style.display = 'block';
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
            container.style.position = 'relative';
            container.style.transform = 'none';
            container.style.zIndex = '10';
            container.style.transition = 'none';
            console.log(`✅ Made ${menuType} menu visible`);
        });

        // Add banner if it doesn't exist
        if (!document.getElementById('dev-banner')) {
            const banner = document.createElement('div');
            banner.id = 'dev-banner';
            banner.innerHTML = `
                🔧 DEVELOPMENT MODE: All Mega Menus <span id="dev-status">Visible</span> | 
                <button id="dev-toggle-btn">Toggle Dev Mode</button>
            `;

            if (document.body) {
                document.body.insertBefore(banner, document.body.firstChild);
                console.log('✅ DEV BANNER ADDED');

                // Add click event
                const btn = document.getElementById('dev-toggle-btn');
                if (btn) {
                    btn.onclick = function () {
                        console.log('🖱️ BUTTON CLICKED!');
                        window.toggleDevMode();
                    };
                    console.log('✅ BUTTON EVENT ADDED');
                }
            }
        }

        // Add keyboard shortcut
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                console.log('⌨️ KEYBOARD SHORTCUT!');
                window.toggleDevMode();
            }
        });

        console.log('🎉 DEV MODE SETUP COMPLETE!');
    }

    // Run setup when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDevMode);
    } else {
        setupDevMode();
    }

    // Also try after a short delay as backup
    setTimeout(setupDevMode, 500);

})();

console.log('🎯 DEV SCRIPT LOADED!'); 