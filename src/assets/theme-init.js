// Apply the saved/OS theme before first paint to avoid a flash (DS §8).
// Externalized from index.html so the Content-Security-Policy can use a strict
// script-src of 'self' without allowing 'unsafe-inline'.
(function () {
  try {
    var t = localStorage.getItem('sa-theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
