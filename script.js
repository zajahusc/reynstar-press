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

const catalogGrid = document.getElementById('catalog-grid');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCatalog(books) {
  if (!catalogGrid) return;

  catalogGrid.innerHTML = books
    .map(
      (book) => `
        <article class="feature-card${book.title === 'The End' ? ' large' : ''} reveal">
          <div class="card-art${book.cover ? '' : ' cover-pending'}" data-cover="${escapeHtml(book.cover)}">
            ${book.cover ? '' : `<span>${escapeHtml(book.coverLabel || 'Cover to be revealed')}</span>`}
          </div>
          <div class="card-copy">
            <span class="tag">${escapeHtml(book.genre)}</span>
            <h3>${escapeHtml(book.title)}</h3>
            <p>${escapeHtml(book.description)}</p>
            <div class="meta-row">
              <span>By ${escapeHtml(book.author)}</span>
              <span>${escapeHtml(book.release)}</span>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  catalogGrid.querySelectorAll('[data-cover]').forEach((cover) => {
    if (cover.dataset.cover) cover.style.backgroundImage = `url("${cover.dataset.cover}")`;
  });

  catalogGrid.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
}

fetch('books.json')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load books.json');
    return response.json();
  })
  .then(renderCatalog)
  .catch(() => {
    if (catalogGrid) catalogGrid.innerHTML = '<p class="catalog-status">The catalog is temporarily unavailable.</p>';
  });

document.querySelector('.newsletter-form')?.addEventListener('submit', (event) => {
  const button = event.currentTarget.querySelector('button');
  const input = event.currentTarget.querySelector('input');

  if (button) {
    button.textContent = 'Sending...';
    button.disabled = true;
  }

  if (input) input.disabled = true;
});
