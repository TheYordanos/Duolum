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

(() => {
	const ALLOWED = ['docx', 'epub', 'md', 'markdown', 'txt'];

	const dialog = $('[data-new-book-dialog]');
	const input = $('[data-upload-input]');
	const error = $('#upload-error');
	let opener = null;

	$$('[data-open-new-book]').forEach((button) => {
		button.addEventListener('click', () => {
			opener = button;
			dialog.showModal();
		});
	});

	$('[data-close-dialog]').addEventListener('click', () => dialog.close());

	// Clicking the dimmed area outside the dialog closes it
	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) dialog.close();
	});

	dialog.addEventListener('close', () => {
		input.value = '';
		error.hidden = true;
		if (opener) opener.focus();
	});

	input.addEventListener('change', () => {
		const file = input.files[0];
		if (!file) return;

		const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';

		if (!ALLOWED.includes(extension)) {
			error.textContent = 'That file type isn\u2019t supported. Choose a DOCX, EPUB, Markdown or TXT file.';
			error.hidden = false;
			input.value = '';
			return;
		}

		error.hidden = true;

		const params = new URLSearchParams({ name: file.name, size: file.size });

		location.href = 'publication-review.html?' + params.toString();
	});
})();