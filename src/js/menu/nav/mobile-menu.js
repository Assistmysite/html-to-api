document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu elements
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    // Check if elements exist
    if (!mobileMenuBtn) {
        console.warn('Mobile menu button not found');
        return;
    }
    
    console.log('Mobile menu elements found:', {
        btn: mobileMenuBtn,
        close: mobileMenuClose,
        panel: mobileMenuPanel,
        overlay: mobileMenuOverlay
    });
    
    // Function to open mobile menu
    function openMobileMenu() {
        console.log('Opening mobile menu...');
        
        // Don't reset mega menu containers - let the mega menu system handle it
        // Just remove active classes from nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Show overlay and panel
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.remove('hidden');
            console.log('Overlay shown');
        }
        
        if (mobileMenuPanel) {
            mobileMenuPanel.classList.remove('hidden');
            mobileMenuPanel.style.display = 'block';
            console.log('Panel shown');
            
            // Animate panel in
            setTimeout(() => {
                mobileMenuPanel.classList.add('open');
                console.log('Panel animation started');
            }, 10);
        }
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        document.body.classList.add('mobile-menu-open');
        
        console.log('Mobile menu opened successfully');
    }
    
    // Function to close mobile menu
    function closeMobileMenu() {
        console.log('Closing mobile menu...');
        
        // Animate panel out
        if (mobileMenuPanel) {
            mobileMenuPanel.classList.remove('open');
            console.log('Panel animation started (closing)');
            
            // Hide panel after animation
            setTimeout(() => {
                mobileMenuPanel.classList.add('hidden');
                mobileMenuPanel.style.display = 'none';
                console.log('Panel hidden');
            }, 300);
        }
        
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.add('hidden');
            console.log('Overlay hidden');
        }
        
        // Restore body scrolling
        document.body.style.overflow = '';
        document.body.classList.remove('mobile-menu-open');
        
        console.log('Mobile menu closed successfully');
    }
    
    // Toggle mobile menu function (for inline onclick if needed)
    window.toggleMobileMenu = function() {
        const isOpen = mobileMenuPanel ? !mobileMenuPanel.classList.contains('hidden') : false;
        console.log('Toggle called, isOpen:', isOpen);
        
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    };
    
    // Event listeners
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger button clicked');
            toggleMobileMenu();
        });
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            closeMobileMenu();
        });
    }
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Overlay clicked');
            closeMobileMenu();
        });
    }
    
    // Close menu when clicking on a link
    const mobileMenuLinks = document.querySelectorAll('#mobileMenuPanel a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('Menu link clicked, closing menu');
            closeMobileMenu();
        });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const isOpen = mobileMenuPanel ? !mobileMenuPanel.classList.contains('hidden') : false;
            if (isOpen) {
                console.log('Escape key pressed, closing menu');
                closeMobileMenu();
            }
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isOpen = mobileMenuPanel ? !mobileMenuPanel.classList.contains('hidden') : false;
        
        if (isOpen) {
            const clickedInsidePanel = mobileMenuPanel && mobileMenuPanel.contains(event.target);
            const clickedOnButton = mobileMenuBtn && mobileMenuBtn.contains(event.target);
            
            if (!clickedInsidePanel && !clickedOnButton) {
                console.log('Click outside detected, closing menu');
                closeMobileMenu();
            }
        }
    });
    
    // Ensure mobile menu is properly hidden on page load
    if (mobileMenuPanel) {
        mobileMenuPanel.classList.add('hidden');
        mobileMenuPanel.style.display = 'none';
        console.log('Panel hidden on page load');
    }
    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.add('hidden');
        console.log('Overlay hidden on page load');
    }
    
    // Close mobile menu when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) { // md breakpoint
            const isOpen = mobileMenuPanel ? !mobileMenuPanel.classList.contains('hidden') : false;
            if (isOpen) {
                console.log('Window resized to desktop, closing menu');
                closeMobileMenu();
            }
        }
    });
    
    // Add event listener for mega menu clicks to close mobile menu
    document.addEventListener('click', function(event) {
        // Check if clicking on mega menu nav items
        if (event.target.closest('.nav-item[data-megamenu]')) {
            const isOpen = mobileMenuPanel ? !mobileMenuPanel.classList.contains('hidden') : false;
            if (isOpen) {
                console.log('Mega menu item clicked, closing mobile menu');
                // Don't close immediately, let the mega menu system handle it
                // The mega menu will close mobile menu and then open itself
            }
        }
    });
    
    console.log('Mobile menu initialization complete');
});
