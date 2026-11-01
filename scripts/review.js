(() => {
	const SHORT_CHAPTER_WORDS = 300;

	const tablist = $('[role="tablist"]');
	const panels = $$('[role="tabpanel"]');
	const list = $('#chapter-list');
	const titleInput = $('#chapter-title');
	const prose = $('#chapter-prose');
	const preview = $('.chapter-preview');
	const actions = {
		up: $('[data-chapter-action="up"]'),
		down: $('[data-chapter-action="down"]'),
		merge: $('[data-chapter-action="merge"]'),
		remove: $('[data-chapter-action="remove"]'),
	};

	const formatNumber = (number) => number.toLocaleString('en-US');
	const chapters = () => $$('.chapter-item', list);
	const words = (chapter) => Number(chapter.dataset.words);
	let current = chapters()[0];
	let snapshot = null;

	const status = $('#review-status-text');
	const undoButton = $('#review-undo');

	function announce(message, undoable) {
		status.textContent = message;
		undoButton.hidden = !undoable;
		if (!undoable) snapshot = null;
	}

	function remember() {
		snapshot = { html: list.innerHTML, index: chapters().indexOf(current) };
	}

	undoButton.addEventListener('click', () => {
		if (!snapshot) return;

		list.innerHTML = snapshot.html;
		current = chapters()[snapshot.index];
		announce('Change undone.', false);
		select(current);
		$('.chapter-select[aria-current="true"]', list).focus();
	});

	function showFile() {
		const params = new URLSearchParams(location.search);
		const name = params.get('name');
		const size = Number(params.get('size'));

		if (name) {
			const extension = name.includes('.') ? name.split('.').pop() : '';

			$('[data-file-name]').textContent = name;
			$('[data-file-type]').textContent = extension.slice(0, 8).toUpperCase() || 'FILE';
		}

		if (size > 0) {
			$('[data-file-size]').textContent = size >= 1048576
				? (size / 1048576).toFixed(1) + ' MB'
				: Math.max(1, Math.round(size / 1024)) + ' KB';
		}
	}

	function refresh() {
		const items = chapters();
		let total = 0;

		items.forEach((chapter, index) => {
			const count = words(chapter);
			const select = $('.chapter-select', chapter);

			total += count;

			$('.chapter-number', chapter).textContent = index + 1;
			$('.chapter-words', chapter).textContent = formatNumber(count) + ' words';
			$('.chapter-flag', chapter).hidden = count >= SHORT_CHAPTER_WORDS;
			select.setAttribute('aria-current', String(chapter === current));
		});

		$('#summary-words').textContent = formatNumber(total);
		$('#summary-chapters').textContent = items.length;

		const position = items.indexOf(current);

		actions.up.disabled = position === 0;
		actions.down.disabled = position === items.length - 1;
		actions.merge.disabled = position === items.length - 1;
		actions.remove.disabled = items.length === 1;
	}

	function select(chapter) {
		current = chapter;
		titleInput.value = $('.chapter-name', chapter).textContent;

		const source = $('.chapter-source', chapter).cloneNode(true);
		prose.replaceChildren(...source.childNodes);
		preview.scrollTop = 0;

		refresh();
	}

	list.addEventListener('click', (event) => {
		const button = event.target.closest('.chapter-select');

		if (button) select(button.closest('.chapter-item'));
	});

	titleInput.addEventListener('input', () => {
		$('.chapter-name', current).textContent = titleInput.value.trim() || 'Untitled chapter';
	});

	function moveUp() {
		const previous = current.previousElementSibling;

		if (previous) list.insertBefore(current, previous);
	}

	function moveDown() {
		const next = current.nextElementSibling;

		if (next) list.insertBefore(next, current);
	}

	function mergeWithNext() {
		const next = current.nextElementSibling;
		if (!next) return;

		remember();

		const source = $('.chapter-source', current);

		source.append(...$('.chapter-source', next).childNodes);
		current.dataset.words = words(current) + words(next);
		next.remove();

		announce('Merged with the next chapter.', true);
		select(current);
	}

	function removeCurrent() {
		const items = chapters();
		if (items.length === 1) return;

		remember();

		const neighbor = current.nextElementSibling || current.previousElementSibling;

		current.remove();
		announce('Chapter removed.', true);
		select(neighbor);
	}

	const handlers = { up: moveUp, down: moveDown, merge: mergeWithNext, remove: removeCurrent };

	Object.entries(actions).forEach(([name, button]) => {
		button.addEventListener('click', () => {
			handlers[name]();

			if (name === 'up' || name === 'down') refresh();
			if (button.disabled) $('.chapter-select[aria-current="true"]', list).focus();
		});
	});

	const controller = initTabs(tablist, (tab) => {
		panels.forEach((panel) => {
			panel.hidden = panel.id !== tab.getAttribute('aria-controls');
		});
	});

	$$('[data-step-link]').forEach((button) => {
		button.addEventListener('click', () => {
			const tab = controller.tabs.find((item) => item.dataset.step === button.dataset.stepLink);

			controller.select(tab, { focus: true });
			$('.main-content').scrollTop = 0;
		});
	});

	const amountField = $('#amount-field');
	const amountLabel = $('#amount-label');
	const sampleField = $('#sample-field');

	function updatePricing() {
		const choice = $('input[name="pricing"]:checked').value;
		const labels = { fixed: 'Price', pwyw: 'Minimum price' };

		amountField.hidden = !(choice in labels);
		amountLabel.textContent = labels[choice] || 'Price';
		sampleField.hidden = choice === 'free';
	}

	$$('input[name="pricing"]').forEach((radio) => radio.addEventListener('change', updatePricing));

	const coverInput = $('#book-cover');
	const coverPreview = $('#cover-preview');
	let coverUrl = null;

	coverInput.addEventListener('change', () => {
		const file = coverInput.files[0];
		if (!file) return;

		if (coverUrl) URL.revokeObjectURL(coverUrl);

		coverUrl = URL.createObjectURL(file);
		coverPreview.src = coverUrl;
	});

	showFile();
	updatePricing();
	select(current);
})();
