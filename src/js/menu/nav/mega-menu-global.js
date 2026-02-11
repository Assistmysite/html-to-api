document.addEventListener('DOMContentLoaded', function () {
    // Initialize mega menu functionality
    function initMegaMenu() {
        // Get all mega menu containers
        const megaMenuContainers = document.querySelectorAll('[data-mega-menu-container]');
        if (!megaMenuContainers.length) return;

        // Find all header links that should trigger the mega menu
        const headerLinks = document.querySelectorAll('.nav-item[data-megamenu]');
        // Find all navigation items without mega menus (regular links)
        const regularNavLinks = document.querySelectorAll('nav li a:not([data-megamenu])');
        let currentMenuId = null;
        let isMenuVisible = false;
        let currentContainer = null;
        let lastMouseX = 0;
        let lastMouseY = 0;
        let lastHoverTime = 0;
        let isFirstHover = true;

        // Enhanced function to determine animation direction based on mouse movement
        function getAnimationDirection(currentMouseX, currentMouseY = 0, isInitial = false) {
            // Only use top-to-bottom for very first hover ever, not for menu switches
            if (isInitial && currentMenuId === null) {
                console.log('Using top-to-bottom: first hover ever');
                return 'top-to-bottom';
            }

            const deltaX = currentMouseX - lastMouseX;
            const deltaY = currentMouseY - lastMouseY;
            const timeDelta = Date.now() - lastHoverTime;

            // Calculate total movement and dominant axis
            const horizontalMovement = Math.abs(deltaX);
            const verticalMovement = Math.abs(deltaY);
            const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            console.log('Direction check:', {
                currentMouseX,
                lastMouseX,
                deltaX,
                deltaY,
                horizontalMovement,
                verticalMovement,
                totalMovement,
                timeDelta,
                horizontalDominant: horizontalMovement > verticalMovement * 0.5 // More forgiving ratio
            });

            // Check if we have enough movement and time window is valid
            if (totalMovement > 2 && timeDelta < 4000) { // Very low threshold for any movement
                // Check if horizontal movement is dominant (at least 50% of vertical movement)
                if (horizontalMovement > verticalMovement * 0.5) {
                    const direction = deltaX > 0 ? 'left-to-right' : 'right-to-left';
                    console.log('Using horizontal animation:', direction);
                    return direction;
                }
            }

            console.log('Using top-to-bottom: fallback');
            return 'top-to-bottom'; // Default fallback
        }

        // Enhanced function to apply directional animation classes
        function applyDirectionalAnimation(container, direction) {
            // Remove any existing animation classes
            container.classList.remove(
                'animate-from-top',
                'animate-from-left',
                'animate-from-right'
            );

            // Force a reflow to ensure classes are removed
            container.offsetHeight;

            // Apply new animation class based on direction
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

        // Enhanced function to hide mega menu
        function hideMegaMenu(container) {
            if (!container) {
                return;
            }

            container.classList.remove('opacity-100');
            container.classList.add('opacity-0', 'pointer-events-none');

            setTimeout(() => {
                container.style.display = 'none';
                // Remove animation classes when hiding
                container.classList.remove(
                    'animate-from-top',
                    'animate-from-left',
                    'animate-from-right'
                );
            }, 300);
        }

        // NEW: Function to hide all mega menu containers
        function hideAllMegaMenus() {
            megaMenuContainers.forEach(container => {
                container.classList.remove('opacity-100');
                container.classList.add('opacity-0', 'pointer-events-none');
                container.style.display = 'none';
                // Remove animation classes
                container.classList.remove(
                    'animate-from-top',
                    'animate-from-left',
                    'animate-from-right'
                );
            });
        }

        // Enhanced function to show a specific mega menu panel with directional animation
        function showMegaMenuPanel(menuId, mouseX = 0, mouseY = 0) {
            if (currentMenuId === menuId && isMenuVisible) {
                return;
            }

            // Find the corresponding container for this menu ID
            const targetContainer = document.querySelector(`[data-mega-menu-container="${menuId}"]`);

            // If no mega menu container exists for this menu ID, hide any open menus and return
            if (!targetContainer) {
                hideAllMegaMenus();
                isMenuVisible = false;
                currentMenuId = null;
                currentContainer = null;
                return;
            }

            // IMPORTANT: Hide all other mega menus first
            hideAllMegaMenus();

            // Determine animation direction
            const direction = getAnimationDirection(mouseX, mouseY, currentMenuId === null);

            // Apply directional animation
            applyDirectionalAnimation(targetContainer, direction);

            // Show the target container
            targetContainer.style.display = 'block';

            // Force reflow to ensure animation classes are applied
            targetContainer.offsetHeight;

            targetContainer.classList.remove('opacity-0', 'pointer-events-none');
            targetContainer.classList.add('opacity-100');

            currentMenuId = menuId;
            isMenuVisible = true;
            currentContainer = targetContainer;
            isFirstHover = false;
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            lastHoverTime = Date.now();

            // Initialize showcase for this container
            initShowcase(targetContainer);
        }

        // Add hover handlers to header links with mega menus
        headerLinks.forEach(link => {
            link.addEventListener('mouseenter', function (e) {
                const menuId = this.getAttribute('data-megamenu');
                console.log('Mouse enter on:', menuId, 'at X:', e.clientX, 'Y:', e.clientY, 'lastX:', lastMouseX, 'lastY:', lastMouseY);

                // Store the mouse position BEFORE calling showMegaMenuPanel
                const currentMouseX = e.clientX;
                const currentMouseY = e.clientY;
                showMegaMenuPanel(menuId, currentMouseX, currentMouseY);
            });

            // Enhanced mouse movement tracking for direction detection
            link.addEventListener('mousemove', function (e) {
                // Update mouse position more frequently for better direction detection
                if (Math.abs(e.clientX - lastMouseX) > 1 || Math.abs(e.clientY - lastMouseY) > 1) { // Track both X and Y
                    lastMouseX = e.clientX;
                    lastMouseY = e.clientY;
                    lastHoverTime = Date.now();
                }
            });

            // Add click handler for mobile/touch devices
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const menuId = this.getAttribute('data-megamenu');

                if (currentMenuId === menuId && isMenuVisible) {
                    hideAllMegaMenus();
                    isMenuVisible = false;
                    currentMenuId = null;
                    currentContainer = null;
                    isFirstHover = true;
                } else {
                    showMegaMenuPanel(menuId, e.clientX, e.clientY);
                }
            });
        });

        // Enhanced handlers for regular navigation links (without mega menus)
        regularNavLinks.forEach(link => {
            link.addEventListener('mouseenter', function () {
                if (isMenuVisible) {
                    hideAllMegaMenus();
                    isMenuVisible = false;
                    currentMenuId = null;
                    currentContainer = null;
                    isFirstHover = true;
                }
            });
        });

        // Add global mouse movement tracking for the navigation area
        const navigation = document.querySelector('nav');
        if (navigation) {
            navigation.addEventListener('mousemove', function (e) {
                // Continuously track mouse position for better direction detection
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                lastHoverTime = Date.now();
            });
        }

        // Close mega menu when clicking outside
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.nav-item[data-megamenu]') &&
                !event.target.closest('[data-mega-menu-container]')) {
                if (isMenuVisible) {
                    hideAllMegaMenus();
                    isMenuVisible = false;
                    currentMenuId = null;
                    currentContainer = null;
                    isFirstHover = true;
                }
            }
        });

        // Enhanced mouse leave handling for the entire header area
        const header = document.getElementById('siteHeader');
        if (header) {
            header.addEventListener('mouseleave', function (e) {
                // Only hide if we're not hovering over any mega menu
                if (!e.relatedTarget || !e.relatedTarget.closest('[data-mega-menu-container]')) {
                    if (isMenuVisible) {
                        hideAllMegaMenus();
                        isMenuVisible = false;
                        currentMenuId = null;
                        currentContainer = null;
                        isFirstHover = true;
                    }
                }
            });
        }

        // Enhanced mouse leave handling for each mega menu container
        megaMenuContainers.forEach(container => {
            container.addEventListener('mouseleave', function (e) {
                // Only hide if we're not hovering over a nav item
                if (!e.relatedTarget || !e.relatedTarget.closest('.nav-item[data-megamenu]')) {
                    hideAllMegaMenus();
                    isMenuVisible = false;
                    currentMenuId = null;
                    currentContainer = null;
                    isFirstHover = true;
                }
            });
        });

        // Initialize showcase functionality for each container
        megaMenuContainers.forEach(container => {
            initShowcase(container);
        });
    }

    // Initialize showcase functionality
    function initShowcase(panel) {
        const menuLinks = panel.querySelectorAll('.menu-link');
        const showcaseDisplay = panel.querySelector('.showcase-display');
        const loadingIndicator = panel.querySelector('.mega-menu-loading');
        const descriptionDisplay = panel.querySelector('.mega-menu-description p');
        let currentImageIndex = 0;

        // Handle menu item hover with smooth transitions
        menuLinks.forEach((link, index) => {
            const item = link.closest('.mega-menu-item');
            const image = item.querySelector('.mega-menu-item-image');
            const description = item.querySelector('.mega-menu-item-description');

            link.addEventListener('mouseenter', function () {
                if (index !== currentImageIndex && image && showcaseDisplay) {
                    // Show loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.style.opacity = '1';
                    }

                    // Fade out current image - NO SCALE
                    showcaseDisplay.style.opacity = '0';

                    setTimeout(() => {
                        // Change image source
                        showcaseDisplay.src = image.src;
                        showcaseDisplay.alt = image.alt || 'Feature showcase';

                        // Update description
                        if (description && descriptionDisplay) {
                            descriptionDisplay.textContent = description.textContent;
                        }

                        // Fade in new image - NO SCALE
                        showcaseDisplay.style.opacity = '1';
                        currentImageIndex = index;

                        // Hide loading indicator
                        if (loadingIndicator) {
                            loadingIndicator.style.opacity = '0';
                        }
                    }, 150);
                }
            });

            // Add keyboard navigation support
            link.addEventListener('focus', function () {
                this.dispatchEvent(new Event('mouseenter'));
            });

            // Handle keyboard navigation
            link.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextLink = this.closest('li').nextElementSibling?.querySelector('.menu-link');
                    if (nextLink) nextLink.focus();
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevLink = this.closest('li').previousElementSibling?.querySelector('.menu-link');
                    if (prevLink) prevLink.focus();
                }
                if (e.key === 'Escape') {
                    this.blur();
                }
            });
        });

        // Reset to first image and description on menu leave
        panel.addEventListener('mouseleave', function () {
            const firstItem = panel.querySelector('.mega-menu-item:first-child');
            if (firstItem) {
                const firstImage = firstItem.querySelector('.mega-menu-item-image');
                const firstDescription = firstItem.querySelector('.mega-menu-item-description');

                if (currentImageIndex !== 0 && firstImage && showcaseDisplay) {
                    showcaseDisplay.style.opacity = '0';
                    setTimeout(() => {
                        showcaseDisplay.src = firstImage.src;
                        showcaseDisplay.alt = firstImage.alt || 'Feature showcase';

                        // Reset description to first item
                        if (firstDescription && descriptionDisplay) {
                            descriptionDisplay.textContent = firstDescription.textContent;
                        }

                        // Fade in - NO SCALE
                        showcaseDisplay.style.opacity = '1';
                        currentImageIndex = 0;
                    }, 150);
                }
            }
        });
    }

    // Initialize mobile menu functionality
    function initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMobileMenu = document.getElementById('closeMobileMenu');
        const menuOpen = document.getElementById('menuOpen');
        const menuClose = document.getElementById('menuClose');
        const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');

        if (!mobileMenuToggle || !mobileMenu) return;

        // Toggle mobile menu
        mobileMenuToggle.addEventListener('click', function () {
            const isOpen = !mobileMenu.classList.contains('translate-x-full');

            if (isOpen) {
                // Close menu
                mobileMenu.classList.add('translate-x-full');
                mobileMenu.classList.remove('translate-x-0');
                if (menuOpen) menuOpen.classList.remove('opacity-0');
                if (menuClose) menuClose.classList.add('opacity-0');
                document.body.classList.remove('overflow-hidden');
            } else {
                // Open menu
                mobileMenu.classList.remove('translate-x-full');
                mobileMenu.classList.add('translate-x-0');
                if (menuOpen) menuOpen.classList.add('opacity-0');
                if (menuClose) menuClose.classList.remove('opacity-0');
                document.body.classList.add('overflow-hidden');
            }
        });

        // Close mobile menu with X button
        if (closeMobileMenu) {
            closeMobileMenu.addEventListener('click', function () {
                mobileMenu.classList.add('translate-x-full');
                mobileMenu.classList.remove('translate-x-0');
                if (menuOpen) menuOpen.classList.remove('opacity-0');
                if (menuClose) menuClose.classList.add('opacity-0');
                document.body.classList.remove('overflow-hidden');
            });
        }

        // Toggle mobile submenu items
        mobileMenuItems.forEach(item => {
            item.addEventListener('click', function () {
                const targetId = this.getAttribute('data-submenu');
                const targetSubmenu = document.getElementById(targetId);

                if (targetSubmenu) {
                    const isHidden = targetSubmenu.classList.contains('hidden');
                    targetSubmenu.classList.toggle('hidden', !isHidden);
                }
            });
        });
    }

    // Initialize all functionality
    initMegaMenu();
    initMobileMenu();
});

