(() => {
	const layout = $('#chat-layout');
	const composer = $('#chat-composer');
	const input = $('input', composer);
	const requestsEntry = $('.chat-requests-entry');
	const requestsCount = $('#requests-count');
	const navDot = $('[data-unread-dot]');
	const listViews = $$('[data-chat-list-view]');
	// Demo of an account with no messages until there is real data:
	// ?empty has no conversations or requests, ?empty=requests has requests only
	const emptyDemo = new URLSearchParams(location.search).get('empty');

	if (emptyDemo !== null) {
		const scope = emptyDemo === 'requests' ? '[data-chat-list-view="conversations"]' : '.chat-list';
		const ids = $$('.chat-list-item', $(scope)).map((item) => item.dataset.conversation);

		$$('.chat-list-item', $(scope)).forEach((item) => item.closest('li').remove());
		ids.forEach((id) => $('[data-thread="' + id + '"]').remove());
	}

	let items = $$('.chat-list-item');
	let threads = $$('.chat-thread');
	const conversationList = $('[data-chat-list-view="conversations"]');
	const search = $('.chat-list-search input');
	const listNote = $('[data-list-note]');
	const emptyWindow = $('[data-chat-empty]');

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

	function refreshList() {
		const query = search.value.trim().toLowerCase();
		const rows = $$('.chat-list-item', conversationList);
		let shown = 0;

		rows.forEach((item) => {
			const matches = item.textContent.toLowerCase().includes(query);

			item.closest('li').hidden = !matches;
			if (matches) shown += 1;
		});

		search.disabled = rows.length === 0;
		$('[data-list-find]').hidden = rows.length > 0 || countRequests() > 0;
		listNote.hidden = shown > 0;
		listNote.textContent = rows.length === 0
			? 'No conversations yet.'
			: 'No conversations match \u201c' + search.value.trim() + '\u201d.';
	}

	function refreshWindow() {
		const thread = getActiveThread();
		const requests = countRequests();

		emptyWindow.hidden = Boolean(thread);
		composer.hidden = !thread || thread.hasAttribute('data-request');

		if (thread) return;

		$('.empty-state-title', emptyWindow).textContent = requests > 0 ? 'No conversations yet' : 'No messages yet';
		$('.empty-state-text', emptyWindow).textContent = requests > 0
			? 'Open Message requests to see who wants to talk to you.'
			: 'Message someone from their profile to start a conversation.';
		$('[data-chat-empty-action]', emptyWindow).hidden = requests > 0;
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

		updateUnreadIndicators();
		refreshList();
		refreshWindow();
		scrollActiveThreadToBottom();
	}

	function openConversation(id) {
		layout.classList.add('chat-open');
		selectConversation(id);
	}

	// "Message" in the profile modal opens that conversation here instead of reloading the page
	document.addEventListener('profile:message', (event) => {
		const id = event.detail.id;

		if (!threads.some((thread) => thread.dataset.thread === id)) return;

		event.detail.handled = true;
		openConversation(id);
	});

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

		if (first) {
			selectConversation(first.dataset.conversation);
		} else {
			refreshList();
			refreshWindow();
		}
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

	search.addEventListener('input', refreshList);

	updateUnreadIndicators();
	refreshList();
	refreshWindow();
	scrollActiveThreadToBottom();
})();