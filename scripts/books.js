// Hardcoded books until there is a backend. Every book modal on the site reads from here.
const BOOKS = {
	'the-silent-garden': { title: 'The Silent Garden', author: 'James Anderson', authorId: 'james', genre: 'Mystery', year: 2025, chapters: 12, pages: 183, language: 'English' },
	'the-hollow-hour': { title: 'The Hollow Hour', author: 'James Anderson', authorId: 'james', genre: 'Mystery', year: 2023, chapters: 18, pages: 264, language: 'English' },
	'letters-to-tomorrow': { title: 'Letters to Tomorrow', author: 'Sarah Mitchell', authorId: 'sarah', genre: 'Fiction', year: 2024, chapters: 24, pages: 345, language: 'English' },
	'small-hours': { title: 'Small Hours', author: 'Sarah Mitchell', authorId: 'sarah', genre: 'Fiction', year: 2022, chapters: 14, pages: 196, language: 'English' },
	'beyond-the-horizon': { title: 'Beyond the Horizon', author: 'Daniel Brooks', authorId: 'daniel', genre: 'Science Fiction', year: 2026, chapters: 8, pages: 115, language: 'English' },
	'low-tide': { title: 'Low Tide', author: 'Daniel Brooks', authorId: 'daniel', genre: 'Thriller', year: 2025, chapters: 15, pages: 213, language: 'English' },
	'things-we-remember': { title: 'Things We Remember', author: 'Emily Carter', authorId: 'emily', genre: 'Non-fiction', year: 2023, chapters: 16, pages: 230, language: 'English' },
	'flour-and-verse': { title: 'Flour and Verse', author: 'Emily Carter', authorId: 'emily', genre: 'Poetry', year: 2024, chapters: 9, pages: 132, language: 'English' },
	'the-art-of-being': { title: 'The Art of Being', author: 'Michael Reed', authorId: 'michael', genre: 'Non-fiction', year: 2025, chapters: 20, pages: 298, language: 'English' },
	'quiet-waters': { title: 'Quiet Waters', author: 'Olivia Bennett', authorId: 'olivia', genre: 'Romance', year: 2024, chapters: 10, pages: 149, language: 'English' },
	'winter-letters': { title: 'Winter Letters', author: 'Amelia Rose', authorId: 'amelia', genre: 'Romance', year: 2024, chapters: 20, pages: 298, language: 'English' },
	'a-map-of-small-things': { title: 'A Map of Small Things', author: 'Nora Ellis', authorId: 'nora', genre: 'Fantasy', year: 2023, chapters: 14, pages: 196, language: 'English' },
	'the-ember-road': { title: 'The Ember Road', author: 'Nora Ellis', authorId: 'nora', genre: 'Fantasy', year: 2024, chapters: 22, pages: 311, language: 'English' },
	'the-last-orchard': { title: 'The Last Orchard', author: 'Thomas Avery', authorId: null, genre: 'Fiction', year: 2022, chapters: 17, pages: 247, language: 'English' },
	'notes-from-elsewhere': { title: 'Notes from Elsewhere', author: 'Clara Morgan', authorId: 'clara', genre: 'Non-fiction', year: 2024, chapters: 14, pages: 196, language: 'English' },
	'a-place-between': { title: 'A Place Between', author: 'Ethan Cole', authorId: 'ethan', genre: 'Fantasy', year: 2024, chapters: 26, pages: 379, language: 'English' },
	'the-deep-hall': { title: 'The Deep Hall', author: 'Ethan Cole', authorId: 'ethan', genre: 'Fantasy', year: 2025, chapters: 30, pages: 426, language: 'English' },
	'the-open-window': { title: 'The Open Window', author: 'Lucas Gray', authorId: 'lucas', genre: 'Mystery', year: 2023, chapters: 11, pages: 166, language: 'English' },
	'nine-doors': { title: 'Nine Doors', author: 'Lucas Gray', authorId: 'lucas', genre: 'Mystery', year: 2025, chapters: 10, pages: 149, language: 'English' },
	'chalk-dust': { title: 'Chalk Dust', author: 'Tom Becker', authorId: 'tom', genre: 'Fiction', year: 2025, chapters: 7, pages: 98, language: 'English' },
	'dead-reckoning': { title: 'Dead Reckoning', author: 'Marcus Webb', authorId: 'marcus', genre: 'Adventure', year: 2024, chapters: 11, pages: 166, language: 'English' },
	'the-quiet-between': { title: 'The Quiet Between', author: 'Jordan Hale', authorId: 'jordan', genre: 'Fiction', year: 2025, chapters: 12, pages: 183, language: 'English' },
	'salt-and-ember': { title: 'Salt and Ember', author: 'Jordan Hale', authorId: 'jordan', genre: 'Fantasy', year: 2024, chapters: 24, pages: 345, language: 'English' },
	'field-notes-on-leaving': { title: 'Field Notes on Leaving', author: 'Jordan Hale', authorId: 'jordan', genre: 'Non-fiction', year: 2023, chapters: 8, pages: 115, language: 'English' },
};

const BOOK_DESCRIPTION = 'Placeholder description. The full synopsis of the book will appear here once authors can publish their work. It will be a few paragraphs long and give readers a sense of the story, the tone and who it is for.';

// Favourites: a set of book ids shared by every page. Starts with the demo library's favourites.
const FAVORITE_DEFAULTS = ['the-silent-garden', 'letters-to-tomorrow', 'beyond-the-horizon', 'the-art-of-being', 'quiet-waters', 'notes-from-elsewhere'];
const FAVORITES_KEY = 'duolum-favorites';

function getFavorites() {
	try {
		const saved = localStorage.getItem(FAVORITES_KEY);

		if (saved) return new Set(JSON.parse(saved));
	} catch (error) {
		// Storage can be unavailable; the defaults are used
	}

	return new Set(FAVORITE_DEFAULTS);
}

function setFavorite(id, on) {
	const favorites = getFavorites();

	if (on) favorites.add(id);
	else favorites.delete(id);

	try {
		localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
	} catch (error) {
		// The change then only lasts for this page
	}

	document.dispatchEvent(new CustomEvent('favorites:change', { detail: { id, on, count: favorites.size } }));
}

// Ratings: one 1 to 5 star rating per book from the reader. The averages are made-up demo numbers until there is a backend.
const RATINGS_KEY = 'duolum-ratings';

function getRatings() {
	try {
		return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}');
	} catch (error) {
		return {};
	}
}

function getRating(id) {
	return getRatings()[id] || 0;
}

function setRating(id, stars) {
	const ratings = getRatings();

	if (stars) ratings[id] = stars;
	else delete ratings[id];

	try {
		localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
	} catch (error) {
		// The rating then only lasts for this page
	}

	document.dispatchEvent(new CustomEvent('ratings:change', { detail: { id, stars } }));
}

// Everyone else's ratings: a stable fake per book. Some books have none yet.
function demoRatings(id) {
	let hash = 0;

	for (const letter of id) hash = (hash * 31 + letter.charCodeAt(0)) % 9973;

	if (hash % 5 === 0) return { sum: 0, count: 0 };

	const count = 12 + (hash % 440);
	const average = 3.8 + (hash % 12) / 10;

	return { sum: average * count, count };
}

// The average and number of ratings, including the reader's own
function ratingSummary(id) {
	const demo = demoRatings(id);
	const mine = getRating(id);
	const count = demo.count + (mine ? 1 : 0);

	return { count, average: count ? (demo.sum + mine) / count : 0 };
}

// Wires a block of rating circles: [data-rate] circles, an optional [data-rating-clear], [data-rating-label],
// [data-rating-average], [data-rating-input] and [data-rating-own]. Returns render() to call when the book changes.
function bindRating(root, getId, isOwn = () => false) {
	const dots = $$('[data-rate]', root);
	const clear = $('[data-rating-clear]', root);
	const label = $('[data-rating-label]', root);
	const average = $('[data-rating-average]', root);
	const input = $('[data-rating-input]', root);
	const own = $('[data-rating-own]', root);

	function render() {
		const id = getId();
		if (!id) return;

		const mine = getRating(id);
		const summary = ratingSummary(id);

		if (average) {
			average.textContent = summary.count
				? summary.average.toFixed(1) + ' \u00b7 ' + summary.count.toLocaleString('en-US') + (summary.count === 1 ? ' rating' : ' ratings')
				: 'No ratings yet';
		}

		if (input) input.hidden = isOwn(id);
		if (own) own.hidden = !isOwn(id);
		if (clear) clear.hidden = !mine;
		if (label) label.textContent = mine ? 'Your rating' : 'Rate this book';

		dots.forEach((dot) => {
			const value = Number(dot.dataset.rate);

			dot.classList.toggle('on', value <= mine);
			dot.setAttribute('aria-pressed', String(value === mine));
		});
	}

	// Hovering or focusing a circle previews it
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
			const id = getId();

			setRating(id, value === getRating(id) ? 0 : value);
			announce(getRating(id) ? 'You rated this book ' + value + ' out of 5.' : 'Your rating was removed.');
		});
	});

	if (clear) {
		clear.addEventListener('click', () => {
			setRating(getId(), 0);
			announce('Your rating was removed.');
		});
	}

	document.addEventListener('ratings:change', render);

	return render;
}