const destination = document.body.dataset.destination;
if (destination && !destination.startsWith('/') && !destination.includes(':')) {
  const url = new URL(destination, document.baseURI);
  if (url.protocol === 'file:' && url.pathname.endsWith('/')) url.pathname += 'index.html';
  url.search = window.location.search;
  url.hash = window.location.hash;
  window.location.replace(url.href);
}
