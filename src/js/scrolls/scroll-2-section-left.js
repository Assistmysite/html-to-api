<script>
    document.addEventListener('DOMContentLoaded', () => {
        const scrollItems = document.querySelectorAll('.scroll-item'); // Fixed selector
        const colStackReveals = document.querySelectorAll('.col-stack-reveal'); // Fixed selector

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = Array.from(scrollItems).indexOf(entry.target);
                    colStackReveals.forEach((colStackReveal, i) => {
                        colStackReveal.classList.toggle('hidden', i !== index);
                    });
                }
            });
        }, {
            root: null,
            threshold: 0.5 // Adjust this threshold as needed
        });

        scrollItems.forEach((scrollItem) => observer.observe(scrollItem));
    });
</script>