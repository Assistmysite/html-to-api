document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Initializing offcanvas menu');

    // Get the menu toggle button
    const menuToggle = document.getElementById('menuToggle');
    console.log('Menu toggle button found:', menuToggle);

    let offcanvas = null;
    let offcanvasContent = null;

    // Function to create offcanvas structure
    function createOffcanvasStructure() {
        console.log('Creating offcanvas structure');
        if (!offcanvas) {
            // Create offcanvas overlay
            offcanvas = document.createElement('div');
            offcanvas.className = 'offcanvas';

            // Create offcanvas content
            offcanvasContent = document.createElement('div');
            offcanvasContent.className = 'offcanvas-content';

            // Create close button
            const closeButton = document.createElement('button');
            closeButton.className = 'offcanvas-close';
            closeButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;

            // Assemble the structure
            offcanvasContent.appendChild(closeButton);
            offcanvas.appendChild(offcanvasContent);
            document.body.appendChild(offcanvas);

            // Add event listeners
            closeButton.addEventListener('click', closeOffcanvas);
            offcanvas.addEventListener('click', function (e) {
                if (e.target === offcanvas) {
                    closeOffcanvas();
                }
            });
        }
    }

    // Function to load offcanvas content
    async function loadOffcanvasContent() {
        try {
            console.log('Loading offcanvas content...');
            const response = await fetch('../pages/index--offcanvas.html');
            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            console.log('Fetched HTML length:', html.length);

            if (!html || html.trim().length === 0) {
                throw new Error('Fetched content is empty');
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Get the main content from the loaded file
            const mainContent = doc.querySelector('main');
            if (!mainContent) {
                throw new Error('No main content found in the loaded file');
            }

            console.log('Found main content:', mainContent.innerHTML.substring(0, 100) + '...');

            if (offcanvasContent) {
                // Keep the close button
                const existingCloseButton = offcanvasContent.querySelector('.offcanvas-close');
                offcanvasContent.innerHTML = '';
                offcanvasContent.appendChild(existingCloseButton);

                // Create content container
                const contentContainer = document.createElement('div');
                contentContainer.className = 'offcanvas-content-container';

                // Add the main content
                contentContainer.appendChild(mainContent);
                console.log('Content container created with main content');

                // Remove any menuToggle button from loaded content
                const menuToggleInContent = contentContainer.querySelector('#menuToggle');
                if (menuToggleInContent) {
                    menuToggleInContent.remove();
                }

                offcanvasContent.appendChild(contentContainer);
                console.log('Content added to offcanvas');
            }
        } catch (error) {
            console.error('Error loading offcanvas content:', error);
            if (offcanvasContent) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'offcanvas-content-container';
                errorMessage.innerHTML = `
                    <div style="color: red; padding: 2rem;">
                        <h2>Error loading menu content</h2>
                        <p>${error.message}</p>
                        <p>Please try again or contact support if the problem persists.</p>
                    </div>
                `;
                offcanvasContent.appendChild(errorMessage);
            }
        }
    }

    // Function to open the offcanvas
    function openOffcanvas() {
        console.log('Opening offcanvas');
        createOffcanvasStructure();
        loadOffcanvasContent();
        offcanvas.style.display = 'block';
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            offcanvas.classList.add('active');
        });
    }

    // Function to close the offcanvas
    function closeOffcanvas() {
        console.log('Closing offcanvas');
        if (offcanvas) {
            offcanvas.classList.remove('active');
            setTimeout(() => {
                offcanvas.style.display = 'none';
                document.body.style.overflow = '';
                console.log('Offcanvas closed');
            }, 300);
        }
    }

    // Event listeners
    if (menuToggle) {
        console.log('Adding click event listener to menu toggle');
        menuToggle.addEventListener('click', function (e) {
            console.log('Menu toggle clicked');
            e.preventDefault();
            openOffcanvas();
        });
    } else {
        console.error('Menu toggle button not found!');
    }

    // Close offcanvas when pressing Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && offcanvas && offcanvas.style.display === 'block') {
            closeOffcanvas();
        }
    });
}); 