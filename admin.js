const editor = document.getElementById('catalog-editor');
const bookList = document.getElementById('book-list');
const status = document.getElementById('editor-status');
const addBookButton = document.getElementById('add-book');

const blankBook = () => ({
  title: '',
  author: '',
  genre: '',
  description: '',
  release: '',
  cover: '',
  banner: '',
  coverLabel: 'Cover to be revealed'
});

let books = [];

function renderBooks() {
  bookList.innerHTML = books
    .map(
      (book, index) => `
        <fieldset class="editor-card">
          <legend>Book ${index + 1}</legend>
          <button class="remove-book" type="button" data-index="${index}" aria-label="Remove book ${index + 1}">Remove</button>
          <div class="editor-grid">
            <label>Title<input required data-field="title" data-index="${index}" value="${escapeAttribute(book.title)}" /></label>
            <label>Author<input required data-field="author" data-index="${index}" value="${escapeAttribute(book.author)}" /></label>
            <label>Genre<input required data-field="genre" data-index="${index}" value="${escapeAttribute(book.genre)}" /></label>
            <label>Release status<input required data-field="release" data-index="${index}" value="${escapeAttribute(book.release)}" /></label>
            <label class="editor-wide">Cover path or image URL<input data-field="cover" data-index="${index}" value="${escapeAttribute(book.cover)}" placeholder="assets/covers/my-book.png" /></label>
            <label class="editor-wide">Banner path or image URL<input data-field="banner" data-index="${index}" value="${escapeAttribute(book.banner)}" placeholder="assets/banners/my-book-banner.png" /></label>
            <label class="editor-wide">Cover placeholder text<input data-field="coverLabel" data-index="${index}" value="${escapeAttribute(book.coverLabel)}" placeholder="Cover to be revealed" /></label>
            <label class="editor-wide">Description<textarea required data-field="description" data-index="${index}" rows="5">${escapeHtml(book.description)}</textarea></label>
          </div>
        </fieldset>
      `
    )
    .join('');
}

function escapeAttribute(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function readForm() {
  bookList.querySelectorAll('[data-field]').forEach((field) => {
    books[field.dataset.index][field.dataset.field] = field.value.trim();
  });
}

function downloadCatalog() {
  const file = new Blob([`${JSON.stringify(books, null, 2)}\n`], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = 'books.json';
  link.click();
  URL.revokeObjectURL(link.href);
  status.textContent = 'Downloaded books.json. Replace the project file with it, then commit the change.';
}

bookList.addEventListener('input', (event) => {
  const field = event.target.closest('[data-field]');
  if (field) books[field.dataset.index][field.dataset.field] = field.value;
});

bookList.addEventListener('click', (event) => {
  const removeButton = event.target.closest('.remove-book');
  if (!removeButton) return;
  books.splice(Number(removeButton.dataset.index), 1);
  renderBooks();
});

addBookButton.addEventListener('click', () => {
  books.push(blankBook());
  renderBooks();
  bookList.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

editor.addEventListener('submit', (event) => {
  event.preventDefault();
  readForm();
  downloadCatalog();
});

fetch('books.json')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load books.json');
    return response.json();
  })
  .then((catalog) => {
    books = catalog;
    renderBooks();
  })
  .catch(() => {
    books = [blankBook()];
    renderBooks();
    status.textContent = 'Catalog could not be loaded. Start a local server, then reload this page.';
  });
