document.addEventListener('DOMContentLoaded', () => {
    console.log('Accordion script loaded');
    
    const accordionButtons = document.querySelectorAll('.accordion-button');
    const accordionContents = document.querySelectorAll('.accordion-content');
    const icons = document.querySelectorAll('.accordion-button .icon');

    console.log('Found accordion buttons:', accordionButtons.length);
    console.log('Found accordion contents:', accordionContents.length);

    // Function to close all accordion items
    function closeAllAccordions() {
        accordionContents.forEach((content, index) => {
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
            // Reset icon rotation for SVG icons
            if (icons[index]) {
                icons[index].style.transform = 'rotate(0deg)';
            }
        });
    }

    // Function to open accordion item
    function openAccordion(button, content, icon) {
        console.log('Opening accordion');
        
        // Close all other accordions first
        closeAllAccordions();
        
        // Ensure content is visible for height calculation
        content.style.display = 'block';
        content.style.visibility = 'hidden';
        content.style.maxHeight = 'none';
        
        // Get the natural height
        const targetHeight = content.scrollHeight;
        
        // Reset for animation
        content.style.maxHeight = '0px';
        content.style.visibility = 'visible';
        
        // Trigger animation in next frame
        requestAnimationFrame(() => {
            content.style.maxHeight = targetHeight + 'px';
            content.style.opacity = '1';
        });
        
        // Rotate icon for SVG icons
        if (icon) {
            icon.style.transform = 'rotate(180deg)';
        }
    }

    // Function to close accordion item
    function closeAccordion(content, icon) {
        console.log('Closing accordion');
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        
        // Reset icon rotation for SVG icons
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
    }

    // Initialize accordions - ensure all are closed on page load
    closeAllAccordions();

    // Add click event listeners to all accordion buttons
    accordionButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            console.log('Accordion button clicked:', index);
            const content = button.nextElementSibling;
            const icon = button.querySelector('.icon');
            
            // Check if this accordion is already open
            const isOpen = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';
            
            if (!isOpen) {
                openAccordion(button, content, icon);
            } else {
                closeAccordion(content, icon);
            }
        });
    });

    // Handle window resize to recalculate heights
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            accordionContents.forEach((content) => {
                if (content.style.maxHeight !== '0px' && content.style.maxHeight !== '') {
                    // Temporarily remove max-height to get natural height
                    const currentMaxHeight = content.style.maxHeight;
                    content.style.maxHeight = 'none';
                    const targetHeight = content.scrollHeight;
                    content.style.maxHeight = targetHeight + 'px';
                }
            });
        }, 100);
    });
});
