(() => {
	const dialog = $('[data-book-dialog]');
	if (!dialog) return;

	const wantButton = $('[data-want-toggle]', dialog);
	const authorLink = $('[data-book-author-link]', dialog);
	let opener = null;

	function render(id, trigger) {
		const book = BOOKS[id];

		$('[data-book-cover]', dialog).alt = 'Cover of ' + book.title;
		$('[data-book-genre]', dialog).textContent = book.genre;
		$('[data-book-title]', dialog).textContent = book.title;
		$('[data-book-description]', dialog).textContent = BOOK_DESCRIPTION;
		$('[data-book-year]', dialog).textContent = book.year;
		$('[data-book-genre-fact]', dialog).textContent = book.genre;
		$('[data-book-language]', dialog).textContent = book.language;
		$('[data-book-length]', dialog).textContent = book.pages + ' pages · ' + book.chapters + ' chapters';

		// Authors with a profile link to it; others are plain text
		const plain = $('[data-book-author-plain]', dialog);

		authorLink.hidden = !book.authorId;
		plain.hidden = Boolean(book.authorId);

		if (book.authorId) {
			authorLink.textContent = book.author;
			authorLink.dataset.profile = book.authorId;
			authorLink.href = 'browse.html?mode=people&profile=' + book.authorId;
		} else {
			plain.textContent = book.author;
		}

		// Opened from the Want to Read tab of the library: already on the list
		const card = trigger && trigger.closest('[data-book-status]');
		const onList = Boolean(card) && card.dataset.bookStatus === 'want-to-read';

		wantButton.dataset.onList = String(onList);
		wantButton.textContent = onList ? 'On your list' : 'Want to read';
		wantButton.classList.toggle('button-primary', false);
		wantButton.classList.toggle('active', onList);

		$('[data-book-share]', dialog).dataset.shareUrl = 'browse.html?book=' + id;
	}

	function open(id, trigger) {
		if (!BOOKS[id]) return;

		// A book opened from a profile replaces the profile
		const profile = $('[data-profile-dialog]');

		if (profile && profile.open) profile.close();

		opener = trigger || null;
		render(id, trigger);

		if (!dialog.open) dialog.showModal();
	}

	document.addEventListener('click', (event) => {
		const trigger = event.target.closest('[data-book]');
		if (!trigger) return;

		event.preventDefault();
		open(trigger.dataset.book, trigger);
	});

	wantButton.addEventListener('click', () => {
		const isOnList = wantButton.dataset.onList !== 'true';

		wantButton.dataset.onList = String(isOnList);
		wantButton.textContent = isOnList ? 'On your list' : 'Want to read';
		wantButton.classList.toggle('active', isOnList);
	});

	// The author link opens their profile, so this modal steps aside first
	authorLink.addEventListener('click', () => {
		opener = null;
		dialog.close();
	});

	$('[data-close-dialog]', dialog).addEventListener('click', () => dialog.close());

	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) dialog.close();
	});

	dialog.addEventListener('close', () => {
		const another = $('dialog[open]');

		if (!another && opener && document.contains(opener)) opener.focus();
		opener = null;
	});

	const linked = new URLSearchParams(location.search).get('book');

	if (linked) open(linked, null);

	window.openBook = open;
})();