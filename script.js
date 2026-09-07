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
const fallbackCatalog = JSON.parse(document.getElementById('catalog-data')?.textContent || '[]');

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
          <div class="card-art${book.banner ? '' : ' cover-pending'}" data-banner="${escapeHtml(book.banner)}">
            ${book.banner ? '' : `<span>${escapeHtml(book.coverLabel || 'Banner to be revealed')}</span>`}
          </div>
          <div class="card-copy">
            <span class="tag">${escapeHtml(book.genre)}</span>
            <h3>${book.page ? `<a href="${escapeHtml(book.page)}">${escapeHtml(book.title)}</a>` : escapeHtml(book.title)}</h3>
            <p>${escapeHtml(String(book.description || '').split(/\n\s*\n/)[0])}</p>
            ${book.page ? `<a class="text-link" href="${escapeHtml(book.page)}">Explore the book →</a>` : ''}
            <div class="meta-row">
              <span>By <span class="author-name">${escapeHtml(book.author)}</span></span>
              <span>${escapeHtml(book.release)}</span>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  catalogGrid.querySelectorAll('[data-banner]').forEach((banner) => {
    if (banner.dataset.banner) banner.style.backgroundImage = `url("${banner.dataset.banner}")`;
  });

  catalogGrid.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
}

if (catalogGrid) fetch('books.json')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load books.json');
    return response.json();
  })
  .then(renderCatalog)
  .catch(() => {
    renderCatalog(fallbackCatalog);
  });
