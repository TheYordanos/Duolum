const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setActiveTab(tabs, activeTab) {
	tabs.forEach((tab) => {
		const isActive = tab === activeTab;

		tab.classList.toggle('active', isActive);
		tab.setAttribute('aria-pressed', String(isActive));
	});
}

const app = {
	currentPage: 'browse',
	activeNav: 'browse',
	backStack: [],
};

function initNavigation() {
	const navItems = $$('.nav-item');
	const pages = $$('[data-page-section]');
	const main = $('.main-content');

	function showPage(name, activeNav = name) {
		app.currentPage = name;
		app.activeNav = activeNav;

		pages.forEach((page) => {
			page.hidden = page.dataset.pageSection !== name;
		});

		navItems.forEach((item) => {
			const isActive = item.dataset.page === activeNav;

			item.classList.toggle('active', isActive);
			item.setAttribute('aria-current', isActive ? 'page' : 'false');
		});

		main.scrollTop = 0;

		if (name === 'messages') {
			scrollActiveThreadToBottom();
		}
	}

	function goToPage(name) {
		app.backStack = [];
		showPage(name);
	}

	function openDetail(name) {
		app.backStack.push({ page: app.currentPage, activeNav: app.activeNav });
		showPage(name, app.activeNav);
	}

	function goBack() {
		const previous = app.backStack.pop();
		if (previous) showPage(previous.page, previous.activeNav);
	}

	navItems.forEach((item) => {
		item.addEventListener('click', () => goToPage(item.dataset.page));
	});

	document.addEventListener('click', (event) => {
		if (event.target.closest('[data-book-link]')) {
			event.preventDefault();
			openDetail('book');
			return;
		}

		if (event.target.closest('[data-person-link]')) {
			event.preventDefault();
			openDetail('person');
			return;
		}

		if (event.target.closest('[data-back]')) {
			goBack();
			return;
		}

		const pageLink = event.target.closest('[data-go-page]');
		if (pageLink) goToPage(pageLink.dataset.goPage);
	});

	showPage('browse');
}

function initBrowse() {
	const segments = $$('[data-browse-view]');
	const panels = $$('[data-browse-panel]');
	const search = $('.filter-bar .filter-search input');

	function showView(name) {
		setActiveTab(segments, segments.find((segment) => segment.dataset.browseView === name));

		panels.forEach((panel) => {
			panel.hidden = panel.dataset.browsePanel !== name;
		});

		search.placeholder = 'Search ' + name + '...';
		search.setAttribute('aria-label', 'Search ' + name);
	}

	segments.forEach((segment) => {
		segment.addEventListener('click', () => showView(segment.dataset.browseView));
	});

	showView('books');
}

function initFollowButtons() {
	document.addEventListener('click', (event) => {
		const button = event.target.closest('[data-follow-toggle]');
		if (!button) return;

		const isFollowing = button.getAttribute('aria-pressed') !== 'true';

		button.setAttribute('aria-pressed', String(isFollowing));
		button.textContent = isFollowing ? 'Following' : 'Follow';
		button.classList.toggle('button-primary', !isFollowing);
	});
}

function initFollowing() {
	const layout = $('#people-layout');
	const toggle = $('[data-people-toggle]');
	const items = $$('.person-item');
	const cards = $$('.following-grid .book-card');
	const search = $('.people-search input');
	const title = $('#people-content-title');
	const count = $('#people-content-count');
	const actions = $('#people-content-actions');
	const empty = $('#people-empty');
	const emptyTitle = $('h4', empty);
	const emptyText = $('p', empty);
	const emptyBrowse = $('[data-empty-action="browse"]', empty);
	const emptyMessage = $('[data-empty-action="message"]', empty);
	const unfollowed = new Set();
	let selected = 'all';

	const nameOf = (item) => $('.person-name', item).textContent.trim();

	function refreshList() {
		const query = search.value.trim().toLowerCase();

		items.forEach((item) => {
			const id = item.dataset.person;
			if (id === 'all') return;

			item.closest('li').hidden = unfollowed.has(id) || !nameOf(item).toLowerCase().includes(query);
		});
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

		empty.hidden = visible.length > 0;

		if (visible.length === 0) {
			emptyTitle.textContent = isAll ? 'Nothing here yet' : 'Nothing to show yet';
			emptyText.textContent = isAll
				? "You're not following anyone yet. Find people in Browse."
				: nameOf(activeItem) + " hasn't published any books.";
			emptyBrowse.hidden = !isAll;
			emptyMessage.hidden = isAll;
		}
	}

	items.forEach((item) => {
		item.addEventListener('click', () => showPerson(item.dataset.person));
	});

	search.addEventListener('input', refreshList);

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

	showPerson('all');
}

function initFilterTabs({ tabSelector, itemSelector, filterKey, matches }) {
	const tabs = $$(tabSelector);
	const items = $$(itemSelector);

	function setFilter(activeTab) {
		setActiveTab(tabs, activeTab);

		const filter = activeTab.dataset[filterKey];

		items.forEach((item) => {
			item.hidden = !matches(item, filter);
		});
	}

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => setFilter(tab));
	});

	const initialTab = tabs.find((tab) => tab.classList.contains('active'));
	if (initialTab) setFilter(initialTab);
}

function initLibraryFilters() {
	initFilterTabs({
		tabSelector: '[data-library-filter]',
		itemSelector: '.library-grid .book-card',
		filterKey: 'libraryFilter',
		matches: (card, filter) => {
			if (filter === 'all') return true;
			if (filter === 'favorites') return card.dataset.favorite === 'true';
			return card.dataset.bookStatus === filter;
		},
	});
}

function initPublication() {
	const views = $$('[data-publication-view]');
	const links = $$('[data-publication-view-link]');

	function showView(name) {
		views.forEach((view) => {
			view.hidden = view.dataset.publicationView !== name;
		});

		$('.main-content').scrollTop = 0;
	}

	links.forEach((link) => {
		link.addEventListener('click', () => showView(link.dataset.publicationViewLink));
	});

	initFilterTabs({
		tabSelector: '[data-publication-filter]',
		itemSelector: '[data-publication-status]',
		filterKey: 'publicationFilter',
		matches: (row, filter) => filter === 'all' || row.dataset.publicationStatus === filter,
	});

	showView('dashboard');
}

function initProfile() {
	const tabs = $$('[data-profile-tab]');
	const panels = $$('[data-profile-panel]');
	const tabLinks = $$('[data-profile-tab-link]');
	const settingsForm = $('.settings-form');

	function showTab(name) {
		setActiveTab(tabs, tabs.find((tab) => tab.dataset.profileTab === name));

		panels.forEach((panel) => {
			panel.hidden = panel.dataset.profilePanel !== name;
		});
	}

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => showTab(tab.dataset.profileTab));
	});

	tabLinks.forEach((link) => {
		link.addEventListener('click', () => showTab(link.dataset.profileTabLink));
	});

	settingsForm.addEventListener('submit', (event) => event.preventDefault());

	showTab('overview');
}

const chat = {
	layout: $('#chat-layout'),
	items: $$('.chat-list-item'),
	threads: $$('.chat-thread'),
	backButtons: $$('.chat-back'),
	listViews: $$('[data-chat-list-view]'),
	listLinks: $$('[data-chat-list-link]'),
	requestsEntry: $('.chat-requests-entry'),
	requestsCount: $('#requests-count'),
	composer: $('#chat-composer'),
};

function getActiveThread() {
	return chat.threads.find((thread) => !thread.hidden);
}

function scrollActiveThreadToBottom() {
	const thread = getActiveThread();
	if (!thread) return;

	const log = $('.chat-messages', thread);
	log.scrollTop = log.scrollHeight;
}

function showChatListView(name) {
	chat.listViews.forEach((view) => {
		view.hidden = view.dataset.chatListView !== name;
	});
}

function selectConversation(id) {
	chat.items.forEach((item) => {
		const isActive = item.dataset.conversation === id;

		item.classList.toggle('active', isActive);
		item.setAttribute('aria-current', isActive ? 'true' : 'false');

		if (isActive) item.classList.remove('unread');
	});

	chat.threads.forEach((thread) => {
		thread.hidden = thread.dataset.thread !== id;
	});

	const thread = getActiveThread();
	chat.composer.hidden = !thread || thread.hasAttribute('data-request');

	scrollActiveThreadToBottom();
}

function openConversation(id) {
	chat.layout.classList.add('chat-open');
	selectConversation(id);
}

function updateRequestsEntry() {
	const count = chat.threads.filter((thread) => thread.hasAttribute('data-request')).length;

	chat.requestsCount.textContent = count;
	chat.requestsEntry.hidden = count === 0;

	return count;
}

function resolveRequest(thread, accepted) {
	const id = thread.dataset.thread;
	const item = chat.items.find((entry) => entry.dataset.conversation === id);
	const row = item.closest('li');

	if (accepted) {
		thread.removeAttribute('data-request');
		$('.request-bar', thread).remove();
		$('.chat-thread-title p', thread).textContent = 'Last seen recently';
		$('[data-chat-list-view="conversations"] .chat-list-items').prepend(row);

		updateRequestsEntry();
		showChatListView('conversations');
		selectConversation(id);
		return;
	}

	row.remove();
	thread.remove();
	chat.items = chat.items.filter((entry) => entry !== item);
	chat.threads = chat.threads.filter((entry) => entry !== thread);

	const remaining = updateRequestsEntry();

	showChatListView(remaining > 0 ? 'requests' : 'conversations');
	chat.layout.classList.remove('chat-open');

	const firstConversation = $('[data-chat-list-view="conversations"] .chat-list-item');
	if (firstConversation) selectConversation(firstConversation.dataset.conversation);
}

function formatTime(date) {
	return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
}

function createSentMessage(text) {
	const message = document.createElement('div');
	message.className = 'message sent';

	const body = document.createElement('p');
	body.textContent = text;

	const time = document.createElement('span');
	time.className = 'message-time';
	time.textContent = formatTime(new Date());

	message.append(body, time);
	return message;
}

function sendMessage(text) {
	const thread = getActiveThread();
	if (!thread) return;

	$('.chat-messages', thread).append(createSentMessage(text));
	scrollActiveThreadToBottom();
}

function initChat() {
	chat.items.forEach((item) => {
		item.addEventListener('click', () => openConversation(item.dataset.conversation));
	});

	chat.backButtons.forEach((button) => {
		button.addEventListener('click', () => chat.layout.classList.remove('chat-open'));
	});

	chat.listLinks.forEach((link) => {
		link.addEventListener('click', () => showChatListView(link.dataset.chatListLink));
	});

	chat.layout.addEventListener('click', (event) => {
		const action = event.target.closest('[data-request-action]');
		if (!action) return;

		resolveRequest(action.closest('.chat-thread'), action.dataset.requestAction === 'accept');
	});

	const input = $('input', chat.composer);

	chat.composer.addEventListener('submit', (event) => {
		event.preventDefault();

		const text = input.value.trim();
		if (!text) return;

		sendMessage(text);
		input.value = '';
	});

	updateRequestsEntry();
}

initNavigation();
initBrowse();
initFollowButtons();
initLibraryFilters();
initPublication();
initProfile();
initFollowing();
initChat();