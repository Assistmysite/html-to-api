/**
 * Hero Slider - Interactive Slider with Controls
 * Features: Auto-play, pause on hover, navigation controls, progress bar, indicators
 */

class HeroSlider {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 7;
        this.slideInterval = 4000; // 4 seconds per slide
        this.autoPlayTimer = null;
        this.isPlaying = true;
        this.isTransitioning = false;
        
        this.track = document.getElementById('heroSliderTrack');
        this.progressBar = document.querySelector('.hero-slider-progress');
        this.indicators = document.querySelectorAll('.hero-slider-indicator');
        this.prevBtn = document.querySelector('.hero-slider-prev');
        this.nextBtn = document.querySelector('.hero-slider-next');
        this.playPauseBtn = document.querySelector('.hero-slider-play-pause');
        this.pauseIcon = document.querySelector('.hero-slider-pause-icon');
        this.playIcon = document.querySelector('.hero-slider-play-icon');
        
        // Debug logging
        console.log('HeroSlider constructor called');
        console.log('Track element:', this.track);
        console.log('Indicators found:', this.indicators.length);
        
        this.init();
    }
    
    init() {
        if (!this.track) {
            console.warn('Hero slider track not found');
            return;
        }
        
        console.log('Initializing hero slider...');
        
        // Add js-loaded class to container to disable fallback animation
        const container = document.querySelector('.hero-slider-container');
        if (container) {
            container.classList.add('js-loaded');
        }
        
        // Add error handling for images
        this.handleImageErrors();
        
        this.bindEvents();
        this.updateIndicators();
        this.updateProgressBar();
        
        // Start auto-play after a short delay to ensure everything is ready
        setTimeout(() => {
            this.startAutoPlay();
        }, 1000);
        
        console.log('Hero slider initialized successfully');
    }
    
    handleImageErrors() {
        // Add error handling for all images in the slider
        const images = this.track.querySelectorAll('img');
        images.forEach((img, index) => {
            img.addEventListener('error', (e) => {
                console.warn(`Image failed to load for slide ${index}:`, img.src);
                // Replace with a fallback image or placeholder
                img.src = '../asset/images/photos/placeholder-slide.jpg';
                img.alt = 'Image not available';
            });
            
            // Add loading error handling
            img.addEventListener('load', () => {
                console.log(`Image loaded successfully for slide ${index}`);
            });
        });
    }
    
    bindEvents() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Play/Pause button
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }
        
        // Indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextSlide();
            } else if (e.key === ' ') {
                e.preventDefault();
                this.togglePlayPause();
            }
        });
        
        // Pause on hover
        const container = document.querySelector('.hero-slider-container');
        if (container) {
            container.addEventListener('mouseenter', () => this.pause());
            container.addEventListener('mouseleave', () => {
                if (this.isPlaying) {
                    this.resume();
                }
            });
        }
        
        // Touch/swipe support
        this.initTouchSupport();
    }
    
    initTouchSupport() {
        let startX = 0;
        let endX = 0;
        
        this.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        this.track.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe(startX, endX);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }
    
    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide) return;
        
        console.log(`Going to slide ${index}`);
        this.isTransitioning = true;
        this.currentSlide = index;
        
        const translateX = -index * 100;
        this.track.style.transform = `translateX(${translateX}%)`;
        
        this.updateIndicators();
        this.updateProgressBar();
        
        // Reset auto-play timer
        this.resetAutoPlayTimer();
        
        // Remove transition class after animation
        setTimeout(() => {
            this.isTransitioning = false;
        }, 700);
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
        this.goToSlide(prevIndex);
    }
    
    updateIndicators() {
        console.log('Updating indicators, current slide:', this.currentSlide);
        this.indicators.forEach((indicator, index) => {
            if (index === this.currentSlide) {
                indicator.classList.add('bg-white');
                indicator.classList.remove('bg-white/50');
                console.log(`Indicator ${index} set to active`);
            } else {
                indicator.classList.remove('bg-white');
                indicator.classList.add('bg-white/50');
            }
        });
    }
    
    updateProgressBar() {
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
    
    startAutoPlay() {
        console.log('Starting auto-play with interval:', this.slideInterval);
        // Clear any existing timer first
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
        }
        
        this.autoPlayTimer = setInterval(() => {
            if (this.isPlaying) {
                console.log('Auto-play advancing to next slide');
                this.nextSlide();
            }
        }, this.slideInterval);
        
        // Force start the auto-play
        this.isPlaying = true;
    }
    
    resetAutoPlayTimer() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
        }
        this.startAutoPlay();
    }
    
    pause() {
        this.isPlaying = false;
        if (this.pauseIcon) this.pauseIcon.classList.add('hidden');
        if (this.playIcon) this.playIcon.classList.remove('hidden');
    }
    
    resume() {
        this.isPlaying = true;
        if (this.pauseIcon) this.pauseIcon.classList.remove('hidden');
        if (this.playIcon) this.playIcon.classList.add('hidden');
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    destroy() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
        }
    }
}

// Initialize slider when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking for hero slider...');
    
    // Check if we're on a page with the hero slider
    const heroSlider = document.querySelector('.hero-slider-container');
    if (heroSlider) {
        console.log('Hero slider found, initializing...');
        window.heroSliderInstance = new HeroSlider();
        
        // Test the slider after a short delay
        setTimeout(() => {
            if (window.heroSliderInstance) {
                console.log('Testing slider functionality...');
                console.log('Current slide:', window.heroSliderInstance.currentSlide);
                console.log('Is playing:', window.heroSliderInstance.isPlaying);
                
                // Force start auto-play if it's not working
                if (!window.heroSliderInstance.isPlaying) {
                    console.log('Forcing auto-play to start...');
                    window.heroSliderInstance.isPlaying = true;
                    window.heroSliderInstance.startAutoPlay();
                }
            }
        }, 1000);
    } else {
        console.log('Hero slider not found on this page');
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (window.heroSliderInstance) {
        window.heroSliderInstance.destroy();
    }
});

// Global error handler for image loading issues
window.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'IMG') {
        console.warn('Image loading error detected:', e.target.src);
        // Replace with fallback image
        e.target.src = '../asset/images/photos/placeholder-fallback.jpg';
        e.target.alt = 'Image not available';
    }
}, true);
