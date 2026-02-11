<script>
  const section = document.getElementById('scrollable-section');
  let isDown = false;
  let startX;
  let scrollLeft;

  section.addEventListener('mousedown', (e) => {
    isDown = true;
    section.classList.add('active');
    startX = e.pageX - section.offsetLeft;
    scrollLeft = section.scrollLeft;
  });

  section.addEventListener('mouseleave', () => {
    isDown = false;
    section.classList.remove('active');
  });

  section.addEventListener('mouseup', () => {
    isDown = false;
    section.classList.remove('active');
  });

  section.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - section.offsetLeft;
    const walk = (x - startX) * 1; // Adjust the scroll speed
    section.scrollLeft = scrollLeft - walk;
  });
</script>