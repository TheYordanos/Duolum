(() => {
	const tablist = $('[role="tablist"]');
	const panels = $$('[role="tabpanel"]');
	let ready = false;

	// Open the document named in the address, e.g. legal.html#privacy
	const fromAddress = $$('[role="tab"]', tablist).find((tab) => tab.dataset.tab === location.hash.slice(1));

	if (fromAddress) {
		$$('[role="tab"]', tablist).forEach((tab) => tab.classList.toggle('active', tab === fromAddress));
	}

	const controller = initTabs(tablist, (tab) => {
		panels.forEach((panel) => {
			panel.hidden = panel.id !== tab.getAttribute('aria-controls');
		});

		document.title = tab.textContent + ' \u00b7 Legal \u00b7 Duolum';

		if (!ready) return;

		try {
			history.replaceState(null, '', '#' + tab.dataset.tab);
		} catch (error) {
			// Some contexts (for example sandboxed frames) refuse to change the URL
		}
	});

	ready = true;

	window.addEventListener('hashchange', () => {
		const tab = controller.tabs.find((item) => item.dataset.tab === location.hash.slice(1));

		if (tab) controller.select(tab);
	});
})();