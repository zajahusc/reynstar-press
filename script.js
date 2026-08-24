const revealItems = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => observer.observe(item));

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

document.querySelector('.newsletter-form')?.addEventListener('submit', (event) => {
  const button = event.currentTarget.querySelector('button');
  const input = event.currentTarget.querySelector('input');

  if (button) {
    button.textContent = 'Sending...';
    button.disabled = true;
  }

  if (input) input.disabled = true;
});
