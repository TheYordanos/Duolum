(() => {
	const tablist = $('[role="tablist"]');
	const panel = $('#library-grid');
	const cards = $$('.book-card', panel);
	const empty = $('[data-empty]');
	let current = $('[role="tab"][aria-selected="true"]', tablist);

	function matchesFilter(card, filter) {
		if (filter === 'all') return true;
		if (filter === 'favorites') return card.dataset.favorite === 'true';
		return card.dataset.bookStatus === filter;
	}

	function render(tab) {
		const filter = tab.dataset.filter;
		let visible = 0;

		cards.forEach((card) => {
			const show = matchesFilter(card, filter);

			card.hidden = !show;
			if (show) visible += 1;
		});

		panel.hidden = visible === 0;
		panel.setAttribute('aria-labelledby', tab.id);

		empty.hidden = visible > 0;
		$('.empty-state-title', empty).textContent = tab.dataset.emptyTitle;
		$('.empty-state-text', empty).textContent = tab.dataset.emptyText;
	}

	// Which cards are favourites comes from the shared list, so it matches the book modal
	function syncFavorites() {
		const favorites = getFavorites();

		cards.forEach((card) => {
			card.dataset.favorite = String(favorites.has($('[data-book]', card).dataset.book));
		});
	}

	initTabs(tablist, (tab) => {
		current = tab;
		render(tab);
	});

	document.addEventListener('DOMContentLoaded', () => {
		syncFavorites();
		render(current);
	});

	document.addEventListener('favorites:change', () => {
		syncFavorites();
		render(current);
	});
})();