(() => {
	const layout = $('#people-layout');
	const toggle = $('[data-people-toggle]');
	const items = $$('.person-item');
	const cards = $$('.following-grid .book-card');
	const search = $('.people-search input');
	const title = $('#people-content-title');
	const count = $('#people-content-count');
	const actions = $('#people-content-actions');
	const empty = $('#people-empty');
	const emptyTitle = $('.empty-state-title', empty);
	const emptyText = $('.empty-state-text', empty);
	const emptyFind = $('[data-empty-action="find"]', empty);
	const emptyMessage = $('[data-empty-action="message"]', empty);
	const unfollowed = new Set();

	// Demo of following nobody until there is real data: add ?empty to the address
	if (new URLSearchParams(location.search).has('empty')) {
		items.forEach((item) => {
			if (item.dataset.person !== 'all') unfollowed.add(item.dataset.person);
		});
	}
	let selected = 'all';

	const nameOf = (item) => $('.person-name', item).textContent.trim();

	function refreshList() {
		const query = search.value.trim().toLowerCase();
		const note = $('[data-list-note]');
		let followed = 0;
		let shown = 0;

		items.forEach((item) => {
			const id = item.dataset.person;
			if (id === 'all') return;

			const isFollowed = !unfollowed.has(id);
			const matches = nameOf(item).toLowerCase().includes(query);

			if (isFollowed) followed += 1;
			if (isFollowed && matches) shown += 1;

			item.closest('li').hidden = !isFollowed || !matches;
		});

		search.disabled = followed === 0;

		note.hidden = shown > 0;
		note.textContent = followed === 0
			? "You're not following anyone yet."
			: 'No one you follow matches \u201c' + search.value.trim() + '\u201d.';
	}

	function showPerson(id) {
		selected = id;

		items.forEach((item) => {
			const isActive = item.dataset.person === id;

			item.classList.toggle('active', isActive);
			item.setAttribute('aria-current', String(isActive));
		});

		const isAll = id === 'all';
		const activeItem = items.find((item) => item.dataset.person === id);

		const visible = cards.filter((card) => {
			return !unfollowed.has(card.dataset.person) && (isAll || card.dataset.person === id);
		});

		cards.forEach((card) => {
			card.hidden = !visible.includes(card);
		});

		title.textContent = isAll ? 'New releases' : nameOf(activeItem);
		count.textContent = visible.length === 1 ? '1 book' : visible.length + ' books';
		actions.hidden = isAll;
		if (!isAll) $('[data-view-profile]').dataset.profile = id;

		empty.hidden = visible.length > 0;

		if (visible.length === 0) {
			emptyTitle.textContent = isAll ? 'Nothing here yet' : 'Nothing to show yet';
			emptyText.textContent = isAll
				? "You're not following anyone yet. Find people to follow in Browse."
				: nameOf(activeItem) + " hasn't published any books.";
			emptyFind.hidden = !isAll;
			emptyMessage.hidden = isAll;
		}
	}

	items.forEach((item) => {
		item.addEventListener('click', () => showPerson(item.dataset.person));
	});

	search.addEventListener('input', refreshList);

	// The profile modal: show the right follow state, and follow or unfollow from it
	document.addEventListener('profile:open', (event) => {
		setFollowing($('[data-profile-follow]'), !unfollowed.has(event.detail.id));
	});

	document.addEventListener('click', (event) => {
		const button = event.target.closest('[data-profile-follow]');
		if (!button) return;

		const id = button.dataset.person;

		if (button.dataset.following === 'true') {
			unfollowed.delete(id);
		} else {
			unfollowed.add(id);
		}

		refreshList();
		if (selected === id && unfollowed.has(id)) showPerson('all');
	});

	$('[data-unfollow]').addEventListener('click', () => {
		unfollowed.add(selected);
		refreshList();
		showPerson('all');
	});

	toggle.addEventListener('click', () => {
		const isCollapsed = layout.classList.toggle('collapsed');

		toggle.setAttribute('aria-expanded', String(!isCollapsed));
		toggle.setAttribute('aria-label', isCollapsed ? 'Expand list' : 'Collapse list');
	});

	refreshList();
	showPerson('all');
})();