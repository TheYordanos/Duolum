(() => {
	const tablist = $('[role="tablist"]');
	const panel = $('#publication-list');
	const empty = $('[data-empty]');

	initTabs(tablist, (tab) => {
		const filter = tab.dataset.filter;
		let visible = 0;

		$$('[data-status]', panel).forEach((row) => {
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

		// The writer marks the chapters themselves on the write page
		location.href = 'write.html?import=' + encodeURIComponent(file.name);
	});
})();

// Removing a book asks first
(() => {
	const dialog = $('[data-remove-dialog]');
	const panel = $('#publication-list');
	let row = null;
	let opener = null;

	panel.addEventListener('click', (event) => {
		const button = event.target.closest('[data-remove-book]');
		if (!button) return;

		opener = button;
		row = button.closest('[data-status]');

		const title = $('h3', row).textContent;
		const published = row.dataset.status === 'published';

		$('[data-remove-title]').textContent = 'Remove \u201c' + title + '\u201d?';
		$('[data-remove-text]').textContent = published
			? 'The book and all of its chapters will be deleted, and readers will no longer find it. This can\u2019t be undone.'
			: 'The draft and all of its chapters will be deleted. This can\u2019t be undone.';
		dialog.showModal();
	});

	$$('[data-close-dialog]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));

	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) dialog.close();
	});

	$('[data-remove-confirm]').addEventListener('click', () => {
		const title = $('h3', row).textContent;

		row.remove();
		row = null;
		opener = null;
		dialog.close();

		// Run the current tab's filter again so the list and its empty state are right
		$('[role="tab"][aria-selected="true"]', $('[role="tablist"]')).click();
		announce(title + ' was removed.');
	});

	dialog.addEventListener('close', () => {
		if (opener && document.contains(opener)) opener.focus();
	});
})();