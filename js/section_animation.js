document.addEventListener('DOMContentLoaded', () => {   
  // Sections Fade-in Animation
  const sectionsToObserve = document.querySelectorAll('.fade-in-section');
  if (sectionsToObserve.length > 0) {
      const observerOptions = {
          threshold: 0.7 // Trigger when 70% of the element is visible
      };
      const intersectionCallback = (entries) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  entry.target.classList.add('visible');
              } else {
                  entry.target.classList.remove('visible');
              }
          });
      };

      const observer = new IntersectionObserver(intersectionCallback, observerOptions);
      sectionsToObserve.forEach(section => observer.observe(section));
  }
});
