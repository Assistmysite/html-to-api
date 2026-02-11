
            document.addEventListener('DOMContentLoaded', function() {
                // Initialize enhanced mega menu functionality
                function initEnhancedMegaMenu() {
                    const navItems = document.querySelectorAll('.nav-item[data-megamenu]');
                    const containers = document.querySelectorAll('[data-mega-menu-container]');
                    const overlay = document.getElementById('megaMenuOverlay');
                    const closeButtons = document.querySelectorAll('.mega-menu-close');
                    const otherNavLinks = document.querySelectorAll('nav a:not([data-megamenu])');
                    let currentActivePanel = null;
                    let currentActiveNav = null;
                    let scrollPosition = 0;
                    let mobileMenuOpen = false;
                    let pendingMegaMenuAction = null;
                    
                    // Function to check if mobile menu is open
                    function checkMobileMenuState() {
                        const mobileMenuPanel = document.getElementById('mobileMenuPanel');
                        mobileMenuOpen = mobileMenuPanel ? !mobileMenuPanel.classList.contains('hidden') : false;
                        return mobileMenuOpen;
                    }
                    
                    // Function to prevent page scrolling
                    function preventScrolling() {
                        scrollPosition = window.pageYOffset;
                        document.body.style.top = `-${scrollPosition}px`;
                        document.body.classList.add('mega-menu-active');
                    }
                    
                    // Function to restore page scrolling
                    function restoreScrolling() {
                        document.body.classList.remove('mega-menu-active');
                        document.body.style.top = '';
                        // Don't force scroll - just let the body position reset naturally
                    }
                    
                    // Function to show overlay
                    function showOverlay() {
                        if (overlay) {
                            overlay.classList.add('active');
                        }
                    }
                    
                    // Function to hide overlay
                    function hideOverlay() {
                        if (overlay) {
                            overlay.classList.remove('active');
                        }
                    }
                    
                    // Enhanced function to determine animation direction - always right to left
                    function getAnimationDirection() {
                        return 'right-to-left';
                    }
                    
                    // Apply directional animation classes
                    function applyDirectionalAnimation(container, direction) {
                        container.classList.remove('animate-from-top', 'animate-from-left', 'animate-from-right');
                        container.offsetHeight; // Force reflow
                        
                        switch (direction) {
                            case 'top-to-bottom':
                                container.classList.add('animate-from-top');
                                break;
                            case 'left-to-right':
                                container.classList.add('animate-from-left');
                                break;
                            case 'right-to-left':
                                container.classList.add('animate-from-right');
                                break;
                            default:
                                container.classList.add('animate-from-top');
                        }
                    }
                    
                    // Show mega menu panel with right-to-left animation - simplified approach
                    function showMegaMenuPanel(menuId, navItem) {
                        // Check if mobile menu is open first
                        if (checkMobileMenuState()) {
                            console.log('Mobile menu is open, scheduling mega menu to open after mobile closes');
                            // Store the action to perform after mobile menu closes
                            pendingMegaMenuAction = { menuId, navItem };
                            
                            // Close mobile menu first
                            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
                            if (mobileMenuBtn && typeof window.toggleMobileMenu === 'function') {
                                window.toggleMobileMenu();
                            }
                            return;
                        }
                        
                        // Clear any pending action
                        pendingMegaMenuAction = null;
                        
                        const targetContainer = document.querySelector(`[data-mega-menu-container="${menuId}"]`);
                        if (!targetContainer) {
                            console.error('Target container not found for menuId:', menuId);
                            return;
                        }
                        
                        console.log('--- SHOWING PANEL ---');
                        console.log('Target menu:', menuId);
                        console.log('Current active panel:', currentActivePanel ? currentActivePanel.getAttribute('data-mega-menu-container') : 'none');
                        
                        // First, completely reset all containers
                        containers.forEach(container => {
                            container.style.display = 'none';
                            container.classList.remove('opacity-100', 'opacity-0', 'pointer-events-none');
                            container.classList.remove('animate-from-top', 'animate-from-left', 'animate-from-right');
                            container.style.animation = 'none';
                        });
                        
                        // Reset all nav states
                        navItems.forEach(item => item.classList.remove('active'));
                        
                        // Set up the target container for animation
                        navItem.classList.add('active');
                        targetContainer.style.display = 'block';
                        targetContainer.style.animation = 'none'; // Clear any existing animation
                        
                        // Force reflow to ensure clean state
                        targetContainer.offsetHeight;
                        
                        // Start with invisible state
                        targetContainer.classList.add('opacity-0', 'pointer-events-none');
                        
                        // Force another reflow
                        targetContainer.offsetHeight;
                        
                        // Apply the right-to-left animation
                        console.log('Applying animate-from-right class');
                        targetContainer.classList.add('animate-from-right');
                        
                        // Prevent scrolling and show overlay
                        preventScrolling();
                        showOverlay();
                        
                        // Show the panel
                        setTimeout(() => {
                            console.log('Making panel visible');
                            targetContainer.classList.remove('opacity-0', 'pointer-events-none');
                            targetContainer.classList.add('opacity-100');
                            
                            currentActivePanel = targetContainer;
                            currentActiveNav = navItem;
                            console.log('Panel should now be visible');
                        }, 10);
                    }
                    
                    // Hide all mega menu panels - simplified
                    function hideAllMegaMenus() {
                        console.log('--- HIDING ALL PANELS ---');
                        
                        containers.forEach(container => {
                            container.style.display = 'none';
                            container.classList.remove('opacity-100', 'opacity-0', 'pointer-events-none');
                            container.classList.remove('animate-from-top', 'animate-from-left', 'animate-from-right');
                            container.style.animation = 'none';
                        });
                        
                        navItems.forEach(item => item.classList.remove('active'));
                        currentActivePanel = null;
                        currentActiveNav = null;
                        
                        // Restore scrolling and hide overlay
                        restoreScrolling();
                        hideOverlay();
                        
                        console.log('All panels hidden and reset');
                    }
                    
                    // Add click handlers to navigation items
                    navItems.forEach(navItem => {
                        navItem.addEventListener('click', function(e) {
                            e.preventDefault();
                            const menuId = this.getAttribute('data-megamenu');
                            console.log('===============================');
                            console.log('CLICK EVENT - Nav item:', menuId);
                            console.log('Current active nav:', currentActiveNav ? currentActiveNav.getAttribute('data-megamenu') : 'none');
                            console.log('Current active panel:', currentActivePanel ? currentActivePanel.getAttribute('data-mega-menu-container') : 'none');
                            console.log('Is same item?', currentActiveNav === this);
                            console.log('===============================');
                            
                            // Toggle behavior: if clicking the same item, close it
                            if (currentActiveNav === this && currentActivePanel) {
                                console.log('>>> CLOSING SAME MENU');
                                hideAllMegaMenus();
                            } else {
                                console.log('>>> OPENING MENU:', menuId);
                                showMegaMenuPanel(menuId, this);
                            }
                        });
                    });
                    
                    // Panels stay open - no mouseleave closing
                    containers.forEach(container => {
                        container.addEventListener('mouseenter', function() {
                            console.log('Mouse entered container - panel stays open');
                            // Keep the panel visible
                            this.classList.remove('opacity-0', 'pointer-events-none');
                            this.classList.add('opacity-100');
                            this.style.display = 'block';
                        });
                        
                        // No mouseleave event - panels stay open until clicked outside or other nav link
                    });
                    
                    // Close mega menu when clicking on overlay
                    if (overlay) {
                        overlay.addEventListener('click', function() {
                            console.log('Overlay clicked - closing mega menu');
                            hideAllMegaMenus();
                        });
                    }
                    
                    // Add event listeners to close buttons
                    closeButtons.forEach(closeButton => {
                        closeButton.addEventListener('click', function(e) {
                            e.stopPropagation(); // Prevent event bubbling
                            console.log('Close button clicked - closing mega menu');
                            hideAllMegaMenus();
                        });
                    });
                    
                    // Add event listeners to other navigation links (OFFERS, REFERENCEN)
                    otherNavLinks.forEach(navLink => {
                        navLink.addEventListener('click', function() {
                            if (currentActivePanel) {
                                console.log('Other nav link clicked - closing mega menu');
                                hideAllMegaMenus();
                            }
                        });
                    });
                    
                    // Close mega menu when clicking on logo
                    const logo = document.querySelector('.flex-shrink-0 a');
                    if (logo) {
                        logo.addEventListener('click', function() {
                            if (currentActivePanel) {
                                console.log('Logo clicked - closing mega menu');
                                hideAllMegaMenus();
                            }
                        });
                    }
                    
                    // Close mega menu when clicking outside
                    document.addEventListener('click', function(event) {
                        // Don't close if clicking on mobile menu elements
                        if (event.target.closest('#mobileMenuBtn') || 
                            event.target.closest('#mobileMenuPanel') || 
                            event.target.closest('#mobileMenuOverlay')) {
                            return;
                        }
                        
                        if (!event.target.closest('.nav-item[data-megamenu]') &&
                            !event.target.closest('[data-mega-menu-container]')) {
                            hideAllMegaMenus();
                        }
                    });
                    
                    // Close mega menu on Escape key
                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape' && currentActivePanel) {
                            console.log('Escape key pressed - closing mega menu');
                            hideAllMegaMenus();
                        }
                    });
                    
                    // Close when clicking outside the mega menu
                    document.addEventListener('click', function(e) {
                        // If no active panel, nothing to close
                        if (!currentActivePanel) return;
                        
                        // Don't close if clicking on mobile menu elements
                        if (e.target.closest('#mobileMenuBtn') || 
                            e.target.closest('#mobileMenuPanel') || 
                            e.target.closest('#mobileMenuOverlay')) {
                            return;
                        }
                        
                        // Check if click is inside any mega menu container or nav item
                        const clickedInsidePanel = currentActivePanel.contains(e.target);
                        const clickedOnNavItem = navItems.some(item => item.contains(e.target));
                        
                        console.log('Document click detected');
                        console.log('Clicked inside panel:', clickedInsidePanel);
                        console.log('Clicked on nav item:', clickedOnNavItem);
                        console.log('Target element:', e.target);
                        
                        // If clicked outside both the panel and nav items, close the menu
                        if (!clickedInsidePanel && !clickedOnNavItem) {
                            console.log('Click outside detected - closing mega menu');
                            hideAllMegaMenus();
                        }
                    });
                    
                    // Listen for mobile menu state changes
                    const mobileMenuPanel = document.getElementById('mobileMenuPanel');
                    if (mobileMenuPanel) {
                        const observer = new MutationObserver(function(mutations) {
                            mutations.forEach(function(mutation) {
                                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                                    const isMobileOpen = !mobileMenuPanel.classList.contains('hidden');
                                    if (mobileMenuOpen !== isMobileOpen) {
                                        mobileMenuOpen = isMobileOpen;
                                        console.log('Mobile menu state changed:', mobileMenuOpen);
                                        
                                        // If mobile menu is opening, close mega menu
                                        if (mobileMenuOpen && currentActivePanel) {
                                            console.log('Mobile menu opening, closing mega menu');
                                            hideAllMegaMenus();
                                        }
                                        
                                        // If mobile menu is closing and we have a pending mega menu action
                                        if (!mobileMenuOpen && pendingMegaMenuAction) {
                                            console.log('Mobile menu closed, executing pending mega menu action');
                                            setTimeout(() => {
                                                // Ensure mobile menu overlay is hidden
                                                const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
                                                if (mobileMenuOverlay) {
                                                    mobileMenuOverlay.classList.add('hidden');
                                                }
                                                showMegaMenuPanel(pendingMegaMenuAction.menuId, pendingMegaMenuAction.navItem);
                                            }, 100);
                                        }
                                    }
                                }
                            });
                        });
                        
                        observer.observe(mobileMenuPanel, {
                            attributes: true,
                            attributeFilter: ['class']
                        });
                    }
                }
                
                // Initialize the enhanced mega menu
                initEnhancedMegaMenu();
            });
 