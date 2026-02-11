document.addEventListener('DOMContentLoaded', function () {
    const megaMenuContainers = document.querySelectorAll('[data-mega-menu-container]');
    if (!megaMenuContainers.length) return;

    // Initialize each mega menu container
    megaMenuContainers.forEach(menuContainer => {
        let currentImageIndex = 0;
        let isTransitioning = false;

        function initializeMegaMenu() {
            const menuLinks = menuContainer.querySelectorAll('.menu-link');
            const showcaseImages = menuContainer.querySelectorAll('.showcase-image');
            const showcaseDisplay = menuContainer.querySelector('.showcase-display');
            const descriptionDisplay = menuContainer.querySelector('.mega-menu-description p');
            const itemDescriptions = menuContainer.querySelectorAll('.mega-menu-item-description');

            // Set initial image and description (first menu item)
            if (showcaseImages[0] && showcaseDisplay) {
                showcaseDisplay.src = showcaseImages[0].src;
                showcaseDisplay.alt = showcaseImages[0].alt || 'Feature showcase';
                showcaseDisplay.classList.add('image-active');
                // Ensure initial transform is set
                showcaseDisplay.style.transform = 'scale(1)';
                currentImageIndex = 0;
            }

            if (itemDescriptions[0] && descriptionDisplay) {
                descriptionDisplay.textContent = itemDescriptions[0].textContent;
            }

            // Enhanced image transition function with gentle zoom
            function transitionToImage(index) {
                if (isTransitioning || index === currentImageIndex || !showcaseImages[index] || !showcaseDisplay) {
                    return;
                }

                console.log(`Transitioning from image ${currentImageIndex} to image ${index} with gentle zoom`);
                isTransitioning = true;

                // Start exit animation with gentle zoom out
                showcaseDisplay.classList.remove('image-active');
                showcaseDisplay.classList.add('image-exiting');
                console.log('Added image-exiting class (gentle zoom out)');

                setTimeout(() => {
                    // Change image source and prepare for entrance
                    showcaseDisplay.src = showcaseImages[index].src;
                    showcaseDisplay.alt = showcaseImages[index].alt || 'Feature showcase';

                    // Update description
                    if (itemDescriptions[index] && descriptionDisplay) {
                        descriptionDisplay.textContent = itemDescriptions[index].textContent;
                    }

                    // Start entrance animation with gentle zoom in
                    showcaseDisplay.classList.remove('image-exiting');
                    showcaseDisplay.classList.add('image-entering');
                    console.log('Added image-entering class (gentle zoom in)');

                    // Complete entrance animation
                    setTimeout(() => {
                        showcaseDisplay.classList.remove('image-entering');
                        showcaseDisplay.classList.add('image-active');
                        console.log('Added image-active class (normal scale)');
                        currentImageIndex = index;
                        isTransitioning = false;
                    }, 50);

                }, 200); // Wait for exit animation to complete
            }

            // Handle menu item hover with enhanced transitions
            menuLinks.forEach((link, index) => {
                link.addEventListener('mouseenter', function () {
                    transitionToImage(index);
                });

                // Add keyboard navigation support
                link.addEventListener('focus', function () {
                    transitionToImage(index);
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
            const menuPanel = menuContainer.querySelector('.mega-menu-panel');
            if (menuPanel) {
                menuPanel.addEventListener('mouseleave', function () {
                    // Add a small delay to prevent flickering when moving between menu items
                    setTimeout(() => {
                        if (!menuPanel.matches(':hover')) {
                            transitionToImage(0);
                        }
                    }, 100);
                });
            }

            // Enhanced hover effect for image container with gentle zoom
            const imageContainer = menuContainer.querySelector('#image-container');
            if (imageContainer) {
                imageContainer.addEventListener('mouseenter', function () {
                    if (!isTransitioning && showcaseDisplay && showcaseDisplay.classList.contains('image-active')) {
                        // CSS handles the hover zoom via #image-container:hover .showcase-display.image-active
                        console.log('Image container hover - CSS will handle gentle zoom');
                    }
                });

                imageContainer.addEventListener('mouseleave', function () {
                    // CSS automatically reverts the hover effect
                    console.log('Image container leave - CSS will revert zoom');
                });
            }
        }

        // Initialize this mega menu container
        initializeMegaMenu();

        // Handle text editing for menu items in this container
        menuContainer.querySelectorAll('.mega-menu-item-text').forEach(text => {
            text.addEventListener('blur', function () {
                const img = this.closest('.mega-menu-item').querySelector('.mega-menu-item-image');
                if (img) {
                    img.alt = this.textContent;
                }
            });

            text.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });
        });

        // Handle description editing - sync individual descriptions with display
        menuContainer.querySelectorAll('.mega-menu-item-description').forEach((desc, index) => {
            desc.addEventListener('input', function () {
                const descriptionDisplay = menuContainer.querySelector('.mega-menu-description p');
                if (currentImageIndex === index && descriptionDisplay) {
                    descriptionDisplay.textContent = this.textContent;
                }
            });

            desc.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });
        });
    });
});
