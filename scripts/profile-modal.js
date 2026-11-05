(() => {
	const dialog = $('[data-profile-dialog]');
	if (!dialog) return;

	// Hardcoded until there is a backend. Own profile (jordan) is only used for sharing.
	const PEOPLE = {
		jordan: { name: 'Jordan Hale', handle: 'jordanhale', bio: 'Writer of quiet, character-driven fiction and a reader of almost everything else.', joined: 'October 2024', followers: 312, website: 'jordanhale.com', books: ['the-quiet-between', 'salt-and-ember', 'field-notes-on-leaving'] },
		sarah: { name: 'Sarah Mitchell', handle: 'sarahmitchell', bio: 'Writes letters, essays and the occasional novel about family and distance.', joined: 'January 2024', followers: 2310, website: 'sarahmitchell.com', books: ['letters-to-tomorrow', 'small-hours'] },
		james: { name: 'James Anderson', handle: 'jamesanderson', bio: 'Mystery writer, tea drinker and collector of second-hand paperbacks.', joined: 'March 2024', followers: 1204, website: 'jamesanderson.blog', books: ['the-silent-garden', 'the-hollow-hour'] },
		emily: { name: 'Emily Carter', handle: 'emilycarter', bio: 'Poet and part-time baker. Words first, flour second.', joined: 'May 2024', followers: 430, website: '', books: ['things-we-remember', 'flour-and-verse'] },
		daniel: { name: 'Daniel Brooks', handle: 'danielbrooks', bio: 'Writing slow-burn thrillers set in coastal towns.', joined: 'February 2024', followers: 760, website: 'danielbrooks.net', books: ['beyond-the-horizon', 'low-tide'] },
		olivia: { name: 'Olivia Bennett', handle: 'oliviabennett', bio: 'Romance writer who believes in second chances.', joined: 'June 2024', followers: 1580, website: '', books: ['quiet-waters'] },
		michael: { name: 'Michael Reed', handle: 'michaelreed', bio: 'Science fiction, one cold cup of coffee at a time.', joined: 'April 2024', followers: 512, website: 'michaelreed.dev', books: ['the-art-of-being'] },
		priya: { name: 'Priya Nair', handle: 'priyanair', bio: 'Reads about a book a week and always has a recommendation.', joined: 'August 2024', followers: 87, website: '', books: [] },
		tom: { name: 'Tom Becker', handle: 'tombecker', bio: 'Retired teacher writing the stories he never had time for.', joined: 'July 2024', followers: 143, website: '', books: ['chalk-dust'] },
		nora: { name: 'Nora Ellis', handle: 'noraellis', bio: 'Fantasy author building small worlds one map at a time.', joined: 'December 2023', followers: 642, website: 'noraellis.com', books: ['a-map-of-small-things', 'the-ember-road'] },
		lucas: { name: 'Lucas Gray', handle: 'lucasgray', bio: 'Short mysteries and long walks.', joined: 'September 2024', followers: 318, website: '', books: ['the-open-window', 'nine-doors'] },
		clara: { name: 'Clara Morgan', handle: 'claramorgan', bio: 'Essays on travel, home and the places in between.', joined: 'November 2023', followers: 905, website: 'claramorgan.com', books: ['notes-from-elsewhere'] },
		ethan: { name: 'Ethan Cole', handle: 'ethancole', bio: 'Fantasy writer. Currently lost in a very large dungeon.', joined: 'October 2023', followers: 1057, website: 'ethancole.io', books: ['a-place-between', 'the-deep-hall'] },
		amelia: { name: 'Amelia Rose', handle: 'ameliarose', bio: 'Romance and winter. Mostly winter.', joined: 'January 2024', followers: 1722, website: '', books: ['winter-letters'] },
		ava: { name: 'Ava Morrison', handle: 'avamorrison', bio: 'Reader first, occasional writer.', joined: 'September 2024', followers: 52, website: '', books: [] },
		marcus: { name: 'Marcus Webb', handle: 'marcuswebb', bio: 'Writing about sailing, weather and bad decisions.', joined: 'August 2024', followers: 201, website: '', books: ['dead-reckoning'] },
	};

	const count = (value) => value.toLocaleString('en-US');
	const followButton = $('[data-profile-follow]', dialog);
	let current = null;
	let opener = null;

	// Is this person followed? Ask a follow button for them on the page, otherwise assume not
	function isFollowed(id) {
		const button = $('[data-person="' + id + '"][data-follow-toggle]');

		return button ? button.dataset.following === 'true' : false;
	}

	function render(id) {
		const person = PEOPLE[id];

		current = id;
		$('[data-profile-name]', dialog).textContent = person.name;
		$('[data-profile-handle]', dialog).textContent = '@' + person.handle;
		$('[data-profile-bio]', dialog).textContent = person.bio;
		$('[data-profile-joined]', dialog).textContent = 'Joined ' + person.joined;
		$('[data-profile-followers]', dialog).textContent = count(person.followers) + ' followers';

		const websiteItem = $('[data-profile-website-item]', dialog);
		const website = $('[data-profile-website]', dialog);

		websiteItem.hidden = !person.website;
		website.textContent = person.website;
		website.href = person.website ? 'https://' + person.website : '#';

		$('[data-profile-avatar]', dialog).alt = person.name;

		const isOwn = id === 'jordan';

		followButton.hidden = isOwn;
		$('[data-profile-message]', dialog).hidden = isOwn;
		followButton.dataset.person = id;
		setFollowing(followButton, isFollowed(id));

		$('[data-profile-share]', dialog).dataset.shareUrl = 'browse.html?mode=people&profile=' + id;

		const list = $('[data-profile-books]', dialog);

		list.replaceChildren(...person.books.map((bookId) => {
			const book = BOOKS[bookId];
			const item = document.createElement('li');
			const link = document.createElement('a');
			const cover = document.createElement('img');
			const text = document.createElement('div');
			const strong = document.createElement('strong');
			const meta = document.createElement('span');

			link.href = 'browse.html?book=' + bookId;
			link.dataset.book = bookId;
			cover.src = 'imgs/placeholder.png';
			cover.alt = '';
			strong.textContent = book.title;
			meta.textContent = book.genre + ' \u00b7 ' + book.year + ' \u00b7 ' + book.chapters + ' chapters';
			text.append(strong, meta);
			link.append(cover, text);
			item.append(link);

			return item;
		}));

		list.hidden = person.books.length === 0;
		$('[data-profile-empty]', dialog).hidden = person.books.length > 0;
		$('[data-profile-empty-text]', dialog).textContent = person.name + ' hasn’t published any books yet.';
	}

	function open(id, trigger) {
		if (!PEOPLE[id]) return;

		opener = trigger || null;
		render(id);

		if (!dialog.open) dialog.showModal();
		setQueryParam('profile', id);

		// Let pages react, e.g. messages opens the conversation instead of leaving
		document.dispatchEvent(new CustomEvent('profile:open', { detail: { id } }));
	}

	document.addEventListener('click', (event) => {
		const trigger = event.target.closest('[data-profile]');
		if (!trigger) return;

		event.preventDefault();
		open(trigger.dataset.profile, trigger);
	});

	// Keep every follow button for a person in step (common.js has already toggled the clicked one)
	document.addEventListener('click', (event) => {
		const clicked = event.target.closest('[data-person][data-follow-toggle]');
		if (!clicked) return;

		$$('[data-person="' + clicked.dataset.person + '"][data-follow-toggle]').forEach((button) => {
			if (button !== clicked) setFollowing(button, clicked.dataset.following === 'true');
		});
	});

	$('[data-close-dialog]', dialog).addEventListener('click', () => dialog.close());

	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) dialog.close();
	});

	// The message button: on the messages page it closes the modal and shows the chat
	$('[data-profile-message]', dialog).addEventListener('click', (event) => {
		const detail = { id: current, handled: false };

		document.dispatchEvent(new CustomEvent('profile:message', { detail }));

		if (detail.handled) {
			event.preventDefault();
			dialog.close();
		}
	});

	dialog.addEventListener('close', () => {
		setQueryParam('profile', null);
		if (opener && document.contains(opener)) opener.focus();
		opener = null;
	});

	// Deep link: ?profile=james
	const linked = new URLSearchParams(location.search).get('profile');

	if (linked) open(linked, null);

	window.openProfile = open;
})();