// Add error handling and debugging
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing slider...');
    
    try {
        const swiperElement = document.querySelector("#swiper-2");
        if (!swiperElement) {
            console.error('Swiper element #swiper-2 not found');
            return;
        }
        
        console.log('Swiper element found, initializing...');
        
        new Swiper("#swiper-2", {
            slidesPerView: 1,
            centeredSlides: true,
            spaceBetween: 0,
            pagination: {
                el: "#swiper-2 .swiper-custom-pagination",
                clickable: true,
                renderBullet: function (index, className) {
                return `<div class="${className}">
                    <span class="number">${index + 1}</span>
                    <span class="line"></span>
                    </div>`;
                }
            },
            loop: true,
            keyboard: {
                enabled: true,
            },
            navigation: {
                nextEl: "#nav-right",
                prevEl: "#nav-left"
            },
            breakpoints: {
                800: {
                    slidesPerView: 1.5,
                    spaceBetween: 0
                },
                1400: {
                    slidesPerView: 1.5,
                    spaceBetween: 0
                }
            }
        });
        
        console.log('Swiper initialized successfully');
    } catch (error) {
        console.error('Error initializing Swiper:', error);
    }
});