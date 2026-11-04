(() => {
	const params = new URLSearchParams(location.search);
	const bookId = params.get('book');

	// Hardcoded until there is a backend. Opening write.html with no book starts a new "Untitled" one.
	const SILENT_GARDEN = ['Prologue', 'The House on Alder Lane', 'The Garden Wall', 'What the Gardener Left', 'A Visitor After Dark', 'The Letter', 'Interlude', 'The Orchard Road', 'Everything the Rain Knew', 'The Locked Room', 'Thaw', 'Epilogue'];
	const SAMPLE = 'The wall had been there longer than the house. Mara could tell by the way the moss had settled into it, filling every crack the way water fills a footprint.\n\nShe had come out at dawn because the kitchen felt *wrong*. Nothing had been moved and nothing was missing, but the whole room held its breath.';

	const known = typeof BOOKS !== 'undefined' && BOOKS[bookId];
	const book = { title: 'Untitled', genre: '', language: 'English', description: '', cover: 'imgs/placeholder.png' };
	let chapters = [];

	if (known) {
		Object.assign(book, { title: known.title, genre: known.genre, language: known.language, description: BOOK_DESCRIPTION });

		chapters = Array.from({ length: known.chapters }, (item, index) => ({
			title: bookId === 'the-silent-garden' ? SILENT_GARDEN[index] : 'Chapter ' + (index + 1),
			body: index < 3 ? SAMPLE : '',
			published: index < known.chapters - 1,
		}));
	} else if (bookId) {
		// A draft that isn't published yet: make a title from the address
		book.title = bookId.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
		chapters = [1, 2, 3].map((number) => ({ title: 'Chapter ' + number, body: number === 1 ? SAMPLE : '', published: false }));
	} else {
		chapters = [{ title: '', body: '', published: false }];
	}

	const bookTitleLabel = $('[data-book-title]');
	const saved = $('[data-saved]');
	const publishButton = $('[data-publish]');
	const chaptersPanel = $('#write-chapters');
	const chaptersToggle = $('[data-chapters-toggle]');
	const scrim = $('[data-chapters-scrim]');
	const list = $('[data-chapter-list]');
	const titleInput = $('#chapter-title');
	const bodyInput = $('#chapter-body');
	const formatButtons = $$('[data-format-action]');
	const modeButtons = $$('[data-mode]');
	const editorPane = $('[data-pane="write"]');
	const previewPane = $('[data-pane="preview"]');
	const wordCount = $('[data-word-count]');
	const statusLabel = $('[data-chapter-status]');
	const message = $('[data-message]');
	const moveButtons = $$('[data-move]');
	const deleteButton = $('[data-delete-chapter]');
	const narrow = window.matchMedia('(max-width: 800px)');

	let current = 0;
	let mode = 'write';
	let savedTimer = null;
	let messageTimer = null;

	const chapterName = (chapter) => chapter.title.trim() || 'Untitled chapter';

	function say(text) {
		message.textContent = text;
		clearTimeout(messageTimer);
		messageTimer = setTimeout(() => {
			message.textContent = '';
		}, 2400);
	}

	// Saving is only a visual here: the indicator shows the usual "Saving" then "Saved"
	function markSaving() {
		saved.textContent = 'Saving…';
		clearTimeout(savedTimer);
		savedTimer = setTimeout(() => {
			saved.textContent = 'Saved';
		}, 700);
	}

	function renderBookTitle() {
		bookTitleLabel.textContent = book.title;
		document.title = 'Write · ' + book.title + ' · Duolum';
	}

	function renderList() {
		list.replaceChildren(...chapters.map((chapter, index) => {
			const item = document.createElement('li');
			const button = document.createElement('button');
			const number = document.createElement('span');
			const name = document.createElement('span');
			const state = document.createElement('span');

			button.type = 'button';
			button.className = 'write-chapter-item';
			button.setAttribute('aria-current', String(index === current));
			button.dataset.index = index;
			number.className = 'write-chapter-number';
			number.textContent = index + 1;
			name.className = 'write-chapter-name';
			name.textContent = chapterName(chapter);
			state.className = 'write-chapter-state';
			state.textContent = chapter.published ? 'Published' : 'Draft';

			button.append(number, name, state);
			item.append(button);

			return item;
		}));

		moveButtons.forEach((button) => {
			const target = current + Number(button.dataset.move);

			button.disabled = target < 0 || target >= chapters.length;
		});

		deleteButton.disabled = chapters.length === 1;
	}

	function renderFooter() {
		const chapter = chapters[current];
		const words = chapter.body.trim() ? chapter.body.trim().split(/\s+/).length : 0;

		wordCount.textContent = words.toLocaleString('en-US') + (words === 1 ? ' word' : ' words');
		statusLabel.textContent = chapter.published ? 'Published' : 'Draft';

		publishButton.textContent = chapter.published ? 'Unpublish chapter' : 'Publish chapter';
		publishButton.classList.toggle('button-primary', !chapter.published);
	}

	function renderPreview() {
		const chapter = chapters[current];

		$('[data-preview-kicker]').textContent = 'Chapter ' + (current + 1) + ' of ' + chapters.length;
		$('[data-preview-title]').textContent = chapterName(chapter);

		const body = $('[data-preview-body]');

		if (chapter.body.trim()) {
			body.innerHTML = renderMarkdown(chapter.body);
		} else {
			body.innerHTML = '<p class="write-preview-empty">Nothing written in this chapter yet.</p>';
		}
	}

	function select(index, { focus = false } = {}) {
		current = index;
		titleInput.value = chapters[index].title;
		bodyInput.value = chapters[index].body;

		renderList();
		renderFooter();
		if (mode === 'preview') renderPreview();
		if (focus) titleInput.focus();
	}

	function setMode(next, { focus = true } = {}) {
		mode = next;

		modeButtons.forEach((button) => {
			button.setAttribute('aria-pressed', String(button.dataset.mode === next));
		});

		editorPane.hidden = next !== 'write';
		previewPane.hidden = next !== 'preview';
		formatButtons.forEach((button) => {
			button.disabled = next !== 'write';
		});

		if (next === 'preview') {
			renderPreview();
			$('#main').scrollTop = 0;
		} else if (focus) {
			bodyInput.focus();
		}
	}

	modeButtons.forEach((button) => {
		button.addEventListener('click', () => setMode(button.dataset.mode));
	});

	// Chapters panel: a side column on wide screens, a drawer on narrow ones
	function setChaptersOpen(open) {
		chaptersPanel.hidden = !open;
		scrim.hidden = !(open && narrow.matches);
		chaptersToggle.setAttribute('aria-expanded', String(open));
	}

	chaptersToggle.addEventListener('click', () => setChaptersOpen(chaptersPanel.hidden));
	scrim.addEventListener('click', () => setChaptersOpen(false));

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && narrow.matches && !chaptersPanel.hidden && !$('dialog[open]')) {
			setChaptersOpen(false);
			chaptersToggle.focus();
		}
	});

	narrow.addEventListener('change', () => setChaptersOpen(!narrow.matches));

	list.addEventListener('click', (event) => {
		const button = event.target.closest('[data-index]');
		if (!button) return;

		select(Number(button.dataset.index));
		if (narrow.matches) setChaptersOpen(false);
	});

	$('[data-add-chapter]').addEventListener('click', () => {
		chapters.push({ title: '', body: '', published: false });
		select(chapters.length - 1);
		if (mode === 'preview') setMode('write');
		if (narrow.matches) setChaptersOpen(false);
		titleInput.focus();
		markSaving();
		say('Chapter added.');
	});

	moveButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const target = current + Number(button.dataset.move);

			if (target < 0 || target >= chapters.length) return;

			[chapters[current], chapters[target]] = [chapters[target], chapters[current]];
			select(target);
			markSaving();
		});
	});

	// Typing
	titleInput.addEventListener('input', () => {
		chapters[current].title = titleInput.value;
		renderList();
		markSaving();
	});

	bodyInput.addEventListener('input', () => {
		chapters[current].body = bodyInput.value;
		renderFooter();
		markSaving();
	});

	publishButton.addEventListener('click', () => {
		const chapter = chapters[current];

		chapter.published = !chapter.published;
		renderList();
		renderFooter();
		markSaving();
		say(chapter.published ? 'Chapter published.' : 'Chapter unpublished. It is a draft again.');
	});

	// Formatting
	function edit(start, end, text, selectStart, selectEnd) {
		bodyInput.focus();
		bodyInput.setSelectionRange(start, end);

		let done = false;

		try {
			done = document.execCommand('insertText', false, text);
		} catch (error) {
			done = false;
		}

		if (!done || bodyInput.value.slice(start, start + text.length) !== text) {
			bodyInput.setRangeText(text, start, end, 'end');
			bodyInput.dispatchEvent(new Event('input', { bubbles: true }));
		}

		bodyInput.setSelectionRange(selectStart, selectEnd);
	}

	function wrap(marker, placeholder) {
		const { selectionStart: start, selectionEnd: end, value } = bodyInput;
		const text = value.slice(start, end) || placeholder;

		edit(start, end, marker + text + marker, start + marker.length, start + marker.length + text.length);
	}

	function prefixLines(prefixFor, test) {
		const { value } = bodyInput;
		const start = value.lastIndexOf('\n', bodyInput.selectionStart - 1) + 1;
		let end = value.indexOf('\n', bodyInput.selectionEnd);

		if (end === -1) end = value.length;

		const lines = value.slice(start, end).split('\n');
		const allDone = lines.every((line) => test.test(line));
		const next = lines.map((line, index) => (allDone ? line.replace(test, '') : prefixFor(index) + line.replace(test, '')));
		const text = next.join('\n');

		edit(start, end, text, start, start + text.length);
	}

	const actions = {
		bold: () => wrap('**', 'bold text'),
		italic: () => wrap('*', 'italic text'),
		heading: () => prefixLines(() => '# ', /^#{1,6}\s+/),
		quote: () => prefixLines(() => '> ', /^>\s?/),
		bullets: () => prefixLines(() => '- ', /^[-*+]\s+/),
		numbers: () => prefixLines((index) => (index + 1) + '. ', /^\d+[.)]\s+/),
		link: () => {
			const { selectionStart: start, selectionEnd: end, value } = bodyInput;
			const text = value.slice(start, end) || 'link text';
			const url = 'https://';
			const urlStart = start + text.length + 3;

			edit(start, end, '[' + text + '](' + url + ')', urlStart, urlStart + url.length);
		},
		break: () => {
			const { selectionStart: start, selectionEnd: end } = bodyInput;
			const text = '\n\n---\n\n';

			edit(start, end, text, start + text.length, start + text.length);
		},
	};

	$('[data-format]').addEventListener('click', (event) => {
		const button = event.target.closest('[data-format-action]');

		if (button && !button.disabled) actions[button.dataset.formatAction]();
	});

	bodyInput.addEventListener('keydown', (event) => {
		if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

		const shortcut = { b: 'bold', i: 'italic', k: 'link' }[event.key.toLowerCase()];

		if (!shortcut) return;

		event.preventDefault();
		actions[shortcut]();
	});

	// Dialogs
	function wireDialog(dialog, opener) {
		let trigger = null;

		if (opener) {
			opener.addEventListener('click', () => {
				trigger = opener;
				dialog.showModal();
			});
		}

		$$('[data-close-dialog]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));

		dialog.addEventListener('click', (event) => {
			if (event.target === dialog) dialog.close();
		});

		dialog.addEventListener('close', () => {
			if (trigger) trigger.focus();
		});

		return dialog;
	}

	// Book details
	const detailsDialog = wireDialog($('[data-details-dialog]'), $('[data-open-details]'));
	const detailsForm = $('[data-details-form]');
	const coverImage = $('[data-details-cover]');
	const coverInput = $('[data-details-cover-input]');
	const coverError = $('[data-details-cover-error]');
	const fields = detailsForm.elements;
	const COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
	const COVER_MAX = 5 * 1024 * 1024;
	let pendingCover = null;

	function fillDetails() {
		fields.title.value = book.title === 'Untitled' ? '' : book.title;
		fields.genre.value = book.genre;
		fields.language.value = book.language;
		fields.description.value = book.description;
		coverImage.src = book.cover;
		coverError.hidden = true;
		coverInput.value = '';
		pendingCover = null;
	}

	$('[data-open-details]').addEventListener('click', fillDetails);

	coverInput.addEventListener('change', () => {
		const file = coverInput.files[0];

		if (!file) return;

		if (!COVER_TYPES.includes(file.type) || file.size > COVER_MAX) {
			coverError.textContent = !COVER_TYPES.includes(file.type) ? 'Choose a PNG, JPG or WebP image.' : 'That image is over 5 MB. Choose a smaller one.';
			coverError.hidden = false;
			coverInput.value = '';
			return;
		}

		coverError.hidden = true;
		if (pendingCover) URL.revokeObjectURL(pendingCover);
		pendingCover = URL.createObjectURL(file);
		coverImage.src = pendingCover;
	});

	detailsForm.addEventListener('submit', (event) => {
		event.preventDefault();

		book.title = fields.title.value.trim() || 'Untitled';
		book.genre = fields.genre.value;
		book.language = fields.language.value;
		book.description = fields.description.value.trim();
		if (pendingCover) book.cover = pendingCover;
		pendingCover = null;

		renderBookTitle();
		markSaving();
		detailsDialog.close();
		say('Book details saved.');
	});

	// Markdown help
	wireDialog($('[data-help-dialog]'), $('[data-open-help]'));

	// Deleting a chapter asks first
	const deleteDialog = wireDialog($('[data-delete-dialog]'), deleteButton);

	deleteButton.addEventListener('click', () => {
		$('[data-delete-text]').textContent = '“' + chapterName(chapters[current]) + '” will be removed from your book. This can’t be undone.';
	});

	$('[data-confirm-delete]').addEventListener('click', () => {
		chapters.splice(current, 1);
		deleteDialog.close();
		select(Math.min(current, chapters.length - 1));
		markSaving();
		say('Chapter deleted.');
	});

	// Start
	renderBookTitle();
	setChaptersOpen(!narrow.matches);

	const wanted = Number(params.get('chapter'));

	select(wanted >= 1 && wanted <= chapters.length ? wanted - 1 : 0);
	setMode('write', { focus: false });
	if (!bookId) titleInput.focus();
	else window.scrollTo(0, 0);
})();