(() => {
	const dialog = $('[data-book-dialog]');
	if (!dialog) return;

	const wantButton = $('[data-want-toggle]', dialog);
	const favoriteButton = $('[data-favorite-toggle]', dialog);
	let currentId = null;

	function renderFavorite(on) {
		favoriteButton.setAttribute('aria-pressed', String(on));
		favoriteButton.textContent = on ? 'Favorited' : 'Favorite';
		favoriteButton.classList.toggle('active', on);
	}
	const dots = $$('[data-rate]', dialog);

	// The average for everyone, and the reader's own rating (not for their own books)
	function renderRating() {
		const summary = ratingSummary(currentId);
		const mine = getRating(currentId);
		const own = BOOKS[currentId].authorId === 'jordan';

		$('[data-rating-average]', dialog).textContent = summary.count
			? summary.average.toFixed(1) + ' \u00b7 ' + summary.count.toLocaleString('en-US') + (summary.count === 1 ? ' rating' : ' ratings')
			: 'No ratings yet';

		$('[data-rating-input]', dialog).hidden = own;
		$('[data-rating-own]', dialog).hidden = !own;
		$('[data-rating-clear]', dialog).hidden = !mine;
		$('[data-rating-label]', dialog).textContent = mine ? 'Your rating' : 'Rate this book';

		dots.forEach((dot) => {
			const value = Number(dot.dataset.rate);

			dot.classList.toggle('on', value <= mine);
			dot.setAttribute('aria-pressed', String(value === mine));
		});
	}

	// Hovering a circle previews it
	function preview(value) {
		dots.forEach((dot) => dot.classList.toggle('preview', Number(dot.dataset.rate) <= value));
	}

	dots.forEach((dot) => {
		const value = Number(dot.dataset.rate);

		dot.addEventListener('mouseenter', () => preview(value));
		dot.addEventListener('mouseleave', () => preview(0));
		dot.addEventListener('focus', () => preview(value));
		dot.addEventListener('blur', () => preview(0));

		dot.addEventListener('click', () => {
			setRating(currentId, value === getRating(currentId) ? 0 : value);
			announce(getRating(currentId) ? 'You rated this book ' + value + ' out of 5.' : 'Your rating was removed.');
		});
	});

	$('[data-rating-clear]', dialog).addEventListener('click', () => {
		setRating(currentId, 0);
		announce('Your rating was removed.');
	});

	document.addEventListener('ratings:change', () => {
		if (currentId) renderRating();
	});

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

		currentId = id;
		renderFavorite(getFavorites().has(id));
		renderRating();

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
		setQueryParam('book', id);
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

	favoriteButton.addEventListener('click', () => {
		const on = favoriteButton.getAttribute('aria-pressed') !== 'true';

		setFavorite(currentId, on);
		renderFavorite(on);
		announce(on ? 'Added to your favorites.' : 'Removed from your favorites.');
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
		setQueryParam('book', null);
		const another = $('dialog[open]');

		if (!another && opener && document.contains(opener)) opener.focus();
		opener = null;
	});

	const linked = new URLSearchParams(location.search).get('book');

	if (linked) open(linked, null);

	window.openBook = open;
})();