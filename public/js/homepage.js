document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const gameCards = document.querySelectorAll('.game-card');
  const catButtons = document.querySelectorAll('.cat-btn');
  const noResults = document.getElementById('noResults');
  const gameGrid = document.getElementById('gameGrid');

  let activeCategory = getInitialCategory();
  let searchQuery = searchInput.value.trim();

  function getInitialCategory() {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || '';
  }

  function updateFilter() {
    let visibleCount = 0;

    gameCards.forEach(card => {
      const title = card.getAttribute('data-title') || '';
      const category = card.getAttribute('data-category') || '';

      const matchCategory = !activeCategory || category === activeCategory;
      const matchSearch = !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchCategory && matchSearch) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    gameGrid.style.display = visibleCount === 0 ? 'none' : '';

    updateURL();
  }

  function updateURL() {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (searchQuery) params.set('q', searchQuery);
    const qs = params.toString();
    const url = qs ? `/?${qs}` : '/';
    history.replaceState({}, '', url);
  }

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      searchClear.style.display = searchQuery ? 'block' : 'none';
      updateFilter();
    }, 200);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';
    updateFilter();
    searchInput.focus();
  });

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-category') || '';
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateFilter();
    });
  });

  if (searchQuery) {
    searchClear.style.display = 'block';
  }

  updateFilter();
});
