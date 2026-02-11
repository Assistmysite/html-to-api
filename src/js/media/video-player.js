/**
 * Video Player Component
 * Reusable video player section with controls
 */

(function() {
    'use strict';

    class VideoPlayer {
        constructor(container) {
            this.container = container;
            this.video = container.querySelector('.video-player-element');
            this.playPauseBtn = container.querySelector('.video-player-play-pause');
            this.muteBtn = container.querySelector('.video-player-mute');
            this.resetBtn = container.querySelector('.video-player-reset');
            this.volumeSlider = container.querySelector('.video-player-volume-slider');
            this.progressBar = container.querySelector('.video-player-progress');
            this.currentTimeDisplay = container.querySelector('.video-player-current-time');
            this.durationDisplay = container.querySelector('.video-player-duration');
            this.controls = container.querySelector('.video-player-controls');
            
            // Track if user manually paused the video
            this.userPaused = false;
            this.intersectionObserver = null;
            this.hideControlsTimeout = null;
            this.controlsVisible = true;
            this.hideDelay = 3000; // Hide after 3 seconds of inactivity
            
            if (!this.video) {
                console.warn('Video Player: Video element not found in container', container);
                return;
            }

            // Debug: Log found elements
            if (!this.progressBar) {
                console.warn('Video Player: Progress bar not found');
            }
            if (!this.volumeSlider) {
                console.warn('Video Player: Volume slider not found');
            }
            if (!this.resetBtn) {
                console.warn('Video Player: Reset button not found');
            }
            if (!this.muteBtn) {
                console.warn('Video Player: Mute button not found');
            }

            this.init();
        }

        init() {
            // Set initial volume
            this.video.volume = this.volumeSlider ? parseFloat(this.volumeSlider.value) : 0.5;
            
            // Remove autoplay attribute - we'll control it via viewport
            this.video.removeAttribute('autoplay');
            
            // Event listeners
            this.setupEventListeners();
            
            // Setup controls visibility
            this.setupControlsVisibility();
            
            // Setup Intersection Observer for viewport detection
            this.setupIntersectionObserver();
            
            // Check if video is already in viewport on load
            this.checkInitialViewport();
            
            // Show controls immediately (don't wait for video to load)
            this.container.classList.add('video-loaded');
            
            // Update UI on load
            this.video.addEventListener('loadeddata', () => {
                this.container.classList.add('video-loaded');
                this.updatePlayPauseIcon();
                this.updateMuteIcon();
                this.updateDuration();
            });

            // Update duration when metadata is loaded (needed for seeking)
            this.video.addEventListener('loadedmetadata', () => {
                this.updateDuration();
                // Enable progress bar interaction
                if (this.progressBar) {
                    this.progressBar.disabled = false;
                }
            });

            // Handle video errors
            this.video.addEventListener('error', (e) => {
                console.error('Video Player: Error loading video', e);
                console.error('Video error details:', this.video.error);
            });

            // Handle video end
            this.video.addEventListener('ended', () => {
                this.updatePlayPauseIcon();
            });

            // Update progress bar as video plays
            this.video.addEventListener('timeupdate', () => {
                this.updateProgress();
            });

            // Disable progress bar until video metadata is loaded
            if (this.progressBar) {
                this.progressBar.disabled = !this.video.duration || !isFinite(this.video.duration);
            }
        }

        checkInitialViewport() {
            // Check if video is already in viewport when page loads
            if (this.isVideoInViewport() && !this.userPaused) {
                // Small delay to ensure video is ready
                setTimeout(() => {
                    if (this.isVideoInViewport() && !this.userPaused) {
                        this.resetAndPlay();
                    }
                }, 100);
            }
        }

        setupIntersectionObserver() {
            // Check if Intersection Observer is supported
            if (!('IntersectionObserver' in window)) {
                // Fallback: use scroll event for older browsers
                this.setupScrollFallback();
                return;
            }

            // Options for Intersection Observer
            const options = {
                root: null, // Use viewport as root
                rootMargin: '0px',
                threshold: 0.5 // Trigger when 50% of video is visible
            };

            // Create Intersection Observer
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Video is in viewport - reset to beginning and play if not manually paused
                        if (!this.userPaused) {
                            this.resetAndPlay();
                        } else {
                            // Even if user paused, reset to beginning when entering viewport
                            this.resetVideo();
                        }
                    } else {
                        // Video is out of viewport - pause and reset to beginning
                        this.pauseAndReset();
                    }
                });
            }, options);

            // Start observing the video container
            this.intersectionObserver.observe(this.container);
        }

        setupScrollFallback() {
            // Fallback for browsers without Intersection Observer
            let ticking = false;
            let wasInViewport = false;
            
            const checkViewport = () => {
                const isInViewport = this.isVideoInViewport();
                
                if (isInViewport) {
                    // Video entered viewport
                    if (!wasInViewport) {
                        // Reset to beginning when entering viewport
                        if (!this.userPaused) {
                            this.resetAndPlay();
                        } else {
                            this.resetVideo();
                        }
                    } else if (!this.userPaused && this.video.paused) {
                        // Already in viewport but paused - play from current position
                        this.playVideo();
                    }
                } else {
                    // Video left viewport
                    if (wasInViewport) {
                        // Reset to beginning when leaving viewport
                        this.pauseAndReset();
                    }
                }
                
                wasInViewport = isInViewport;
                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(checkViewport);
                    ticking = true;
                }
            }, { passive: true });

            // Check on initial load
            checkViewport();
        }

        setupControlsVisibility() {
            if (!this.controls) return;

            // Show controls on mouse move
            this.container.addEventListener('mousemove', () => {
                this.showControls();
            });

            // Show controls on mouse enter
            this.container.addEventListener('mouseenter', () => {
                this.showControls();
            });

            // Hide controls when mouse leaves container
            this.container.addEventListener('mouseleave', () => {
                this.scheduleHideControls();
            });

            // Keep controls visible when interacting with them
            if (this.controls) {
                this.controls.addEventListener('mouseenter', () => {
                    this.showControls();
                });

                this.controls.addEventListener('mouseleave', () => {
                    this.scheduleHideControls();
                });
            }

            // Show controls when video is clicked and toggle play/pause
            this.video.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showControls();
                this.togglePlayPause();
            });

            // Ensure controls are visible initially
            this.showControls();
            
            // Initially show controls, then hide after delay
            // Controls start visible, then auto-hide after inactivity
            // Don't auto-hide immediately - give user time to see controls
            setTimeout(() => {
                this.scheduleHideControls();
            }, 5000); // Wait 5 seconds before starting auto-hide timer
        }

        showControls() {
            if (!this.controls) return;
            
            // Clear any pending hide timeout
            if (this.hideControlsTimeout) {
                clearTimeout(this.hideControlsTimeout);
                this.hideControlsTimeout = null;
            }

            // Show controls
            this.controls.classList.remove('hidden');
            this.controlsVisible = true;
        }

        hideControls() {
            if (!this.controls) return;
            
            // Only hide if not hovering over container
            if (!this.container.matches(':hover')) {
                this.controls.classList.add('hidden');
                this.controlsVisible = false;
            }
        }

        scheduleHideControls() {
            // Clear any existing timeout
            if (this.hideControlsTimeout) {
                clearTimeout(this.hideControlsTimeout);
            }

            // Schedule hide after delay
            this.hideControlsTimeout = setTimeout(() => {
                this.hideControls();
            }, this.hideDelay);
        }

        setupEventListeners() {
            // Play/Pause button
            if (this.playPauseBtn) {
                this.playPauseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.showControls(); // Show controls when interacting
                    this.togglePlayPause();
                });
            } else {
                console.warn('Video Player: Play/Pause button element not found');
            }

            // Mute button
            if (this.muteBtn) {
                this.muteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.showControls(); // Show controls when interacting
                    this.toggleMute();
                });
            } else {
                console.warn('Video Player: Mute button element not found');
            }

            // Reset button
            if (this.resetBtn) {
                this.resetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.showControls(); // Show controls when interacting
                    this.resetToBeginning();
                });
            } else {
                console.warn('Video Player: Reset button element not found');
            }

            // Volume slider
            if (this.volumeSlider) {
                this.volumeSlider.addEventListener('input', (e) => {
                    e.stopPropagation();
                    this.showControls(); // Show controls when interacting
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        this.setVolume(value);
                    }
                });

                this.volumeSlider.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        this.setVolume(value);
                    }
                });

                this.volumeSlider.addEventListener('mousedown', () => {
                    this.showControls(); // Keep controls visible while adjusting volume
                });
            } else {
                console.warn('Video Player: Volume slider element not found');
            }

            // Progress bar
            if (this.progressBar) {
                this.progressBar.addEventListener('input', (e) => {
                    e.stopPropagation();
                    this.showControls();
                    const value = parseFloat(e.target.value);
                    this.seekTo(value);
                });

                this.progressBar.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const value = parseFloat(e.target.value);
                    this.seekTo(value);
                });

                this.progressBar.addEventListener('mousedown', () => {
                    this.showControls();
                });
            } else {
                console.warn('Video Player: Progress bar element not found');
            }

            // Keyboard controls (only when video container is focused or video is playing)
            document.addEventListener('keydown', (e) => {
                if (document.activeElement.tagName === 'INPUT' || 
                    document.activeElement.tagName === 'TEXTAREA') {
                    return;
                }

                // Only handle if video is in viewport or playing
                if (!this.isVideoInViewport() && this.video.paused) {
                    return;
                }

                switch(e.key) {
                    case ' ':
                        e.preventDefault();
                        this.togglePlayPause();
                        break;
                    case 'm':
                    case 'M':
                        this.toggleMute();
                        break;
                    case 'r':
                    case 'R':
                        e.preventDefault();
                        this.resetToBeginning();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.adjustVolume(0.1);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.adjustVolume(-0.1);
                        break;
                }
            });

        }

        isVideoInViewport() {
            const rect = this.container.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            
            // Check if at least 50% of the video is visible
            const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
            const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
            const visibleArea = visibleHeight * visibleWidth;
            const totalArea = rect.height * rect.width;
            
            return visibleArea > (totalArea * 0.5);
        }

        resetVideo() {
            // Reset video to beginning
            this.video.currentTime = 0;
            this.updateProgress();
        }

        resetToBeginning() {
            // Reset video to beginning (user-triggered)
            this.video.currentTime = 0;
            this.updateProgress();
            // If video is playing, continue playing from the beginning
            if (!this.video.paused) {
                // Video is already playing, just reset the time
                // The video will continue playing from the beginning
            } else {
                // If paused, user might want to play from beginning
                // Optionally auto-play, or just reset
                // For now, just reset without auto-playing
            }
        }

        resetAndPlay() {
            // Reset video to beginning and play
            this.video.currentTime = 0;
            this.playVideo();
        }

        pauseAndReset() {
            // Pause video and reset to beginning
            this.video.pause();
            this.video.currentTime = 0;
            this.updatePlayPauseIcon();
            this.updateProgress();
        }

        playVideo() {
            // Ensure video is muted for autoplay (browser requirement)
            if (!this.video.muted) {
                this.video.muted = true;
                this.updateMuteIcon();
            }
            
            const playPromise = this.video.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.updatePlayPauseIcon();
                    })
                    .catch((error) => {
                        console.log('Video play prevented:', error);
                    });
            }
        }

        pauseVideo() {
            this.video.pause();
            this.updatePlayPauseIcon();
        }

        togglePlayPause() {
            if (this.video.paused) {
                this.userPaused = false; // User wants to play
                this.play();
            } else {
                this.userPaused = true; // User wants to pause
                this.pause();
            }
        }

        play() {
            const playPromise = this.video.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.updatePlayPauseIcon();
                    })
                    .catch((error) => {
                        console.error('Error playing video:', error);
                    });
            }
        }

        pause() {
            this.video.pause();
            this.updatePlayPauseIcon();
        }

        toggleMute() {
            this.video.muted = !this.video.muted;
            this.updateMuteIcon();
            
            // Sync volume slider with muted state
            if (this.volumeSlider) {
                if (this.video.muted) {
                    this.volumeSlider.dataset.previousVolume = this.volumeSlider.value;
                    this.volumeSlider.value = 0;
                } else {
                    const previousVolume = this.volumeSlider.dataset.previousVolume || 0.5;
                    this.volumeSlider.value = previousVolume;
                    this.video.volume = parseFloat(previousVolume);
                }
            }
        }

        setVolume(volume) {
            // Clamp volume between 0 and 1
            volume = Math.max(0, Math.min(1, volume));
            
            this.video.volume = volume;
            this.video.muted = volume === 0;
            
            this.updateMuteIcon();
        }

        adjustVolume(delta) {
            const currentVolume = this.video.muted ? 0 : this.video.volume;
            const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
            
            this.setVolume(newVolume);
            
            if (this.volumeSlider) {
                this.volumeSlider.value = newVolume;
            }
        }

        updatePlayPauseIcon() {
            if (!this.playPauseBtn) return;
            
            const icon = this.playPauseBtn.querySelector('svg');
            if (!icon) return;
            
            // Remove existing icons
            icon.innerHTML = '';
            
            if (this.video.paused) {
                // Show play icon
                icon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                `;
            } else {
                // Show pause icon
                icon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                `;
            }
        }

        updateMuteIcon() {
            if (!this.muteBtn) return;
            
            const icon = this.muteBtn.querySelector('svg');
            if (!icon) return;
            
            // Remove existing icons
            icon.innerHTML = '';
            
            if (this.video.muted || this.video.volume === 0) {
                // Show muted icon
                icon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                `;
            } else if (this.video.volume < 0.5) {
                // Show low volume icon
                icon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                `;
            } else {
                // Show high volume icon
                icon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                `;
            }
        }

        formatTime(seconds) {
            if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
            
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        updateProgress() {
            if (!this.progressBar || !this.video) return;
            
            if (!this.video.duration || !isFinite(this.video.duration)) {
                return;
            }
            
            const progress = (this.video.currentTime / this.video.duration) * 100;
            if (isNaN(progress) || !isFinite(progress)) {
                return;
            }
            
            this.progressBar.value = Math.max(0, Math.min(100, progress));
            
            // Update current time display
            if (this.currentTimeDisplay) {
                this.currentTimeDisplay.textContent = this.formatTime(this.video.currentTime);
            }
        }

        updateDuration() {
            if (!this.durationDisplay) return;
            
            if (this.video.duration && isFinite(this.video.duration)) {
                this.durationDisplay.textContent = this.formatTime(this.video.duration);
            } else {
                this.durationDisplay.textContent = '0:00';
            }
        }

        seekTo(percentage) {
            if (!this.video) {
                console.warn('Video Player: Video element not available for seeking');
                return;
            }
            
            // Wait for video metadata if not loaded yet
            if (!this.video.duration || !isFinite(this.video.duration)) {
                // Try to load metadata
                this.video.load();
                return;
            }
            
            const time = (percentage / 100) * this.video.duration;
            if (isNaN(time) || !isFinite(time) || time < 0) {
                return;
            }
            
            try {
                this.video.currentTime = time;
            } catch (error) {
                console.warn('Video Player: Error seeking video', error);
            }
        }
    }

    // Initialize all video player containers on page load
    document.addEventListener('DOMContentLoaded', function() {
        const videoPlayerContainers = document.querySelectorAll('.video-player-container');
        
        videoPlayerContainers.forEach((container) => {
            const instance = new VideoPlayer(container);
            container._videoPlayerInstance = instance; // Store reference for cleanup
        });
    });

    // Cleanup Intersection Observers on page unload
    window.addEventListener('beforeunload', function() {
        const videoPlayerContainers = document.querySelectorAll('.video-player-container');
        videoPlayerContainers.forEach((container) => {
            const instance = container._videoPlayerInstance;
            if (instance && instance.intersectionObserver) {
                instance.intersectionObserver.disconnect();
            }
        });
    });

    // Export for use in other scripts if needed
    if (typeof window !== 'undefined') {
        window.VideoPlayer = VideoPlayer;
    }
})();
