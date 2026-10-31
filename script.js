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
	pageBeforeDetail: 'browse',
};

function initNavigation() {
	const navItems = $$('.nav-item');
	const pages = $$('[data-page-section]');
	const main = $('.main-content');

	function showPage(name, activeNav = name) {
		app.currentPage = name;

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

	function openBookDetail() {
		if (app.currentPage !== 'book') {
			app.pageBeforeDetail = app.currentPage;
		}

		showPage('book', app.pageBeforeDetail);
	}

	navItems.forEach((item) => {
		item.addEventListener('click', () => showPage(item.dataset.page));
	});

	document.addEventListener('click', (event) => {
		if (event.target.closest('[data-book-link]')) {
			event.preventDefault();
			openBookDetail();
			return;
		}

		if (event.target.closest('[data-book-back]')) {
			showPage(app.pageBeforeDetail);
		}
	});

	showPage('browse');
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

function openConversation(id) {
	chat.items.forEach((item) => {
		const isActive = item.dataset.conversation === id;

		item.classList.toggle('active', isActive);
		item.setAttribute('aria-current', isActive ? 'true' : 'false');

		if (isActive) item.classList.remove('unread');
	});

	chat.threads.forEach((thread) => {
		thread.hidden = thread.dataset.thread !== id;
	});

	chat.layout.classList.add('chat-open');
	scrollActiveThreadToBottom();
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

	const input = $('input', chat.composer);

	chat.composer.addEventListener('submit', (event) => {
		event.preventDefault();

		const text = input.value.trim();
		if (!text) return;

		sendMessage(text);
		input.value = '';
	});
}

initNavigation();
initLibraryFilters();
initPublication();
initProfile();
initChat();