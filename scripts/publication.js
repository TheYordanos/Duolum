(() => {
	const tablist = $('[role="tablist"]');
	const panel = $('#publication-list');
	const rows = $$('[data-status]', panel);
	const empty = $('[data-empty]');

	initTabs(tablist, (tab) => {
		const filter = tab.dataset.filter;
		let visible = 0;

		rows.forEach((row) => {
			const show = filter === 'all' || row.dataset.status === filter;

			row.hidden = !show;
			if (show) visible += 1;
		});

		panel.hidden = visible === 0;
		panel.setAttribute('aria-labelledby', tab.id);

		empty.hidden = visible > 0;
		$('.empty-state-title', empty).textContent = tab.dataset.emptyTitle;
		$('.empty-state-text', empty).textContent = tab.dataset.emptyText;
	});
})();
