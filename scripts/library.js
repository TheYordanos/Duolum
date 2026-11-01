(() => {
	const tablist = $('[role="tablist"]');
	const panel = $('#library-grid');
	const cards = $$('.book-card', panel);
	const empty = $('[data-empty]');

	function matchesFilter(card, filter) {
		if (filter === 'all') return true;
		if (filter === 'favorites') return card.dataset.favorite === 'true';
		return card.dataset.bookStatus === filter;
	}

	initTabs(tablist, (tab) => {
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
	});
})();
