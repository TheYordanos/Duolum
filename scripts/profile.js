(() => {
	const tablist = $('[role="tablist"]');
	const panels = $$('[role="tabpanel"]');
	let ready = false;

	const controller = initTabs(tablist, (tab) => {
		panels.forEach((panel) => {
			panel.hidden = panel.id !== tab.getAttribute('aria-controls');
		});

		if (!ready) return;

		try {
			history.replaceState(null, '', '#' + tab.dataset.tab);
		} catch (error) {
			// Some contexts (for example sandboxed frames) refuse to change the URL
		}
	});

	const initial = controller.tabs.find((tab) => tab.dataset.tab === location.hash.slice(1));
	if (initial) controller.select(initial);

	ready = true;

	$$('[data-tab-link]').forEach((link) => {
		link.addEventListener('click', () => {
			const tab = controller.tabs.find((item) => item.dataset.tab === link.dataset.tabLink);

			if (tab) controller.select(tab, { focus: true });
		});
	});

	$('.settings-form').addEventListener('submit', (event) => event.preventDefault());

	// Demo of a brand-new account until there is real data: add ?empty to the address
	if (new URLSearchParams(location.search).has('empty')) {
		$$('[data-filled]').forEach((element) => {
			element.hidden = true;
		});

		$$('[data-empty]').forEach((element) => {
			element.hidden = false;
		});

		$$('.stat-value').forEach((element) => {
			element.textContent = '0';
		});
	}
})();