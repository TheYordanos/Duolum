const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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

function initLibraryFilters() {
	const tabs = $$('.library-tab');
	const cards = $$('.library-grid .book-card');

	function matchesFilter(card, filter) {
		if (filter === 'all') return true;
		if (filter === 'favorites') return card.dataset.favorite === 'true';
		return card.dataset.bookStatus === filter;
	}

	function setFilter(activeTab) {
		tabs.forEach((tab) => {
			const isActive = tab === activeTab;

			tab.classList.toggle('active', isActive);
			tab.setAttribute('aria-pressed', String(isActive));
		});

		const filter = activeTab.dataset.libraryFilter;

		cards.forEach((card) => {
			card.hidden = !matchesFilter(card, filter);
		});
	}

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => setFilter(tab));
	});

	const initialTab = $('.library-tab.active');
	if (initialTab) setFilter(initialTab);
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
initChat();