(() => {
	const dialog = $('[data-notifications-dialog]');
	if (!dialog) return;

	// Hardcoded until there is a backend. type decides where a click leads.
	const NOTIFICATIONS = [
		{ id: 'n1', type: 'chapter', person: 'Sarah Mitchell', book: 'letters-to-tomorrow', time: '2 hours ago' },
		{ id: 'n2', type: 'follower', person: 'Priya Nair', profile: 'priya', time: 'Yesterday' },
		{ id: 'n3', type: 'chapter', person: 'James Anderson', book: 'the-silent-garden', time: 'Yesterday' },
		{ id: 'n4', type: 'request', person: 'Ava Morrison', time: '2 days ago' },
		{ id: 'n5', type: 'book', person: 'Nora Ellis', book: 'the-ember-road', time: 'Monday' },
		{ id: 'n6', type: 'follower', person: 'Tom Becker', profile: 'tom', time: 'Oct 28' },
	];

	const STORAGE_KEY = 'duolum-read-notifications';
	const list = $('[data-notification-list]');
	const empty = $('[data-notifications-empty]');
	const markAll = $('[data-mark-all-read]');
	const subtitle = $('[data-notifications-subtitle]');
	const dots = $$('[data-notification-dot]');
	const isEmpty = new URLSearchParams(location.search).has('empty');
	const items = isEmpty ? [] : NOTIFICATIONS;
	let read = new Set();
	let opener = null;

	try {
		read = new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'));
	} catch (error) {
		read = new Set();
	}

	function remember() {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...read]));
		} catch (error) {
			// Storage can be unavailable; the read state then lasts until the page reloads
		}
	}

	function describe(item) {
		const bookTitle = item.book ? BOOKS[item.book].title : '';
		const name = document.createElement('strong');
		const rest = document.createElement('span');

		name.textContent = item.person;

		if (item.type === 'chapter') rest.textContent = ' published a new chapter of ' + bookTitle + '.';
		if (item.type === 'book') rest.textContent = ' published a new book, ' + bookTitle + '.';
		if (item.type === 'follower') rest.textContent = ' started following you.';
		if (item.type === 'request') rest.textContent = ' sent you a message request.';

		return [name, rest];
	}

	function render() {
		const unread = items.filter((item) => !read.has(item.id)).length;

		list.replaceChildren(...items.map((item) => {
			const row = document.createElement('li');
			const button = document.createElement('button');
			const marker = document.createElement('span');
			const body = document.createElement('span');
			const text = document.createElement('span');
			const time = document.createElement('span');
			const isUnread = !read.has(item.id);

			button.type = 'button';
			button.className = 'notification-item';
			button.dataset.id = item.id;
			marker.className = 'notification-marker';
			marker.setAttribute('aria-hidden', 'true');
			marker.hidden = !isUnread;
			body.className = 'notification-body';
			text.className = 'notification-text';
			text.append(...describe(item));
			time.className = 'notification-time';
			time.textContent = item.time + (isUnread ? ' · unread' : '');
			body.append(text, time);
			button.append(marker, body);
			row.append(button);

			return row;
		}));

		list.hidden = items.length === 0;
		empty.hidden = items.length > 0;
		markAll.hidden = items.length === 0;
		markAll.disabled = unread === 0;
		subtitle.textContent = items.length === 0 ? '' : (unread === 0 ? 'You’re all caught up.' : unread + (unread === 1 ? ' unread' : ' unread'));
		dots.forEach((dot) => {
			dot.hidden = unread === 0;
		});
	}

	$$('[data-open-notifications]').forEach((trigger) => {
		trigger.addEventListener('click', () => {
			opener = trigger;
			render();
			dialog.showModal();
		});
	});

	list.addEventListener('click', (event) => {
		const button = event.target.closest('[data-id]');
		if (!button) return;

		const item = items.find((entry) => entry.id === button.dataset.id);

		read.add(item.id);
		remember();
		render();

		// Take the person where the notification points
		if (item.type === 'request') {
			location.href = 'messages.html';
			return;
		}

		opener = null;
		dialog.close();

		if (item.book) window.openBook(item.book, null);
		else window.openProfile(item.profile, null);
	});

	markAll.addEventListener('click', () => {
		items.forEach((item) => read.add(item.id));
		remember();
		render();
		announce('All notifications marked as read.');
		$('[data-close-dialog]', dialog).focus();
	});

	$$('[data-close-dialog]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));

	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) dialog.close();
	});

	dialog.addEventListener('close', () => {
		if (opener && document.contains(opener)) opener.focus();
	});

	render();
})();