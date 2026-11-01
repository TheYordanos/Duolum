(() => {
	const layout = $('#chat-layout');
	const composer = $('#chat-composer');
	const input = $('input', composer);
	const requestsEntry = $('.chat-requests-entry');
	const requestsCount = $('#requests-count');
	const navDot = $('[data-unread-dot]');
	const listViews = $$('[data-chat-list-view]');
	let items = $$('.chat-list-item');
	let threads = $$('.chat-thread');

	const getActiveThread = () => threads.find((thread) => !thread.hidden);
	const countRequests = () => threads.filter((thread) => thread.hasAttribute('data-request')).length;

	function updateUnreadIndicators() {
		const requests = countRequests();
		const hasUnread = items.some((item) => item.classList.contains('unread')) || requests > 0;

		requestsCount.textContent = requests;
		requestsEntry.hidden = requests === 0;

		if (navDot) navDot.hidden = !hasUnread;

		return requests;
	}

	function scrollActiveThreadToBottom() {
		const thread = getActiveThread();
		if (!thread) return;

		const log = $('.chat-messages', thread);
		log.scrollTop = log.scrollHeight;
	}

	function showListView(name) {
		listViews.forEach((view) => {
			view.hidden = view.dataset.chatListView !== name;
		});
	}

	function selectConversation(id) {
		items.forEach((item) => {
			const isActive = item.dataset.conversation === id;

			item.classList.toggle('active', isActive);
			item.setAttribute('aria-current', isActive ? 'true' : 'false');

			if (isActive) item.classList.remove('unread');
		});

		threads.forEach((thread) => {
			thread.hidden = thread.dataset.thread !== id;
		});

		const thread = getActiveThread();
		composer.hidden = !thread || thread.hasAttribute('data-request');

		updateUnreadIndicators();
		scrollActiveThreadToBottom();
	}

	function openConversation(id) {
		layout.classList.add('chat-open');
		selectConversation(id);
	}

	function resolveRequest(thread, accepted) {
		const id = thread.dataset.thread;
		const item = items.find((entry) => entry.dataset.conversation === id);
		const row = item.closest('li');

		if (accepted) {
			thread.removeAttribute('data-request');
			$('.request-bar', thread).remove();
			$('.chat-thread-title p', thread).textContent = 'Last seen recently';
			$('[data-chat-list-view="conversations"] .chat-list-items').prepend(row);

			showListView('conversations');
			selectConversation(id);
			return;
		}

		row.remove();
		thread.remove();
		items = items.filter((entry) => entry !== item);
		threads = threads.filter((entry) => entry !== thread);

		const remaining = updateUnreadIndicators();

		showListView(remaining > 0 ? 'requests' : 'conversations');
		layout.classList.remove('chat-open');

		const first = $('[data-chat-list-view="conversations"] .chat-list-item');
		if (first) selectConversation(first.dataset.conversation);
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

	items.forEach((item) => {
		item.addEventListener('click', () => openConversation(item.dataset.conversation));
	});

	$$('.chat-back').forEach((button) => {
		button.addEventListener('click', () => layout.classList.remove('chat-open'));
	});

	$$('[data-chat-list-link]').forEach((link) => {
		link.addEventListener('click', () => showListView(link.dataset.chatListLink));
	});

	layout.addEventListener('click', (event) => {
		const action = event.target.closest('[data-request-action]');
		if (!action) return;

		resolveRequest(action.closest('.chat-thread'), action.dataset.requestAction === 'accept');
	});

	composer.addEventListener('submit', (event) => {
		event.preventDefault();

		const text = input.value.trim();
		if (!text) return;

		const thread = getActiveThread();
		if (!thread) return;

		$('.chat-messages', thread).append(createSentMessage(text));
		input.value = '';
		scrollActiveThreadToBottom();
	});

	updateUnreadIndicators();
	scrollActiveThreadToBottom();
})();
