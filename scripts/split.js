// Importing a manuscript: the writer marks where each chapter starts. Nothing is detected automatically.
(() => {
	const params = new URLSearchParams(location.search);

	if (!params.has('import')) return;

	const fileName = params.get('import');
	const workspace = $('[data-workspace]');
	const split = $('[data-split]');
	const text = $('[data-split-text]');
	const list = $('[data-split-list]');
	const main = $('#split-main');
	const panel = $('#split-chapters');
	const toggle = $('[data-split-toggle]');
	const scrim = $('[data-split-scrim]');
	const undoButton = $('[data-split-undo]');
	const clearButton = $('[data-split-clear]');
	const doneButton = $('[data-split-done]');
	const count = $('[data-split-count]');
	const narrow = window.matchMedia('(max-width: 800px)');

	// Stand-in for the uploaded file until extraction exists: one paragraph per entry
	const paragraphs = [
		'Chapter One',
		'The ferry left the harbour an hour late, and by the time it reached the island the light had already gone grey. Ines stood at the rail with her bag between her feet and watched the lighthouse wink on, off, on again.',
		'Nobody met her at the dock. She had not expected anyone to. The letter had said only that the house would be unlocked, and that she should not mind the cold.',
		'She walked the coast road with her collar turned up. Behind the dunes the sea kept up its slow argument with the land.',
		'The house stood where the road ended, square and white and a little crooked, as if it had leaned into too many winters. The door was unlocked, as promised.',
		'Inside, someone had left a lamp burning in the hall.',
		'Chapter Two',
		'Morning brought a different island. The fog had lifted, and the water was the green of old bottle glass.',
		'Ines found the kitchen in order: bread in a tin, a kettle on the stove, a note held down by a stone. Back by dark. Help yourself. It was signed with a single initial, T.',
		'She ate standing up, looking out at the garden. Somebody had once kept it carefully. Now the beds had gone to seed, and a low wall of piled stones ran along the far side, half swallowed by brambles.',
		'There was a gate in the wall. It was ajar.',
		'She told herself she would only look.',
		'Beyond the gate, the ground sloped toward the cliffs, and in the long grass lay a row of small wooden markers, each worn smooth, each with a name cut so shallowly that she had to kneel to read it.',
		'The last one said Ines.',
		'Chapter Three',
		'T turned out to be Tomas, a man of about sixty with a grey beard and a way of looking at a person as though checking them for leaks.',
		'He came in at dusk smelling of salt and diesel, hung his coat on the one empty hook, and said, without turning around, "You found the gate."',
		'"I found a grave with my name on it."',
		'"Not a grave," Tomas said. "A promise. Your grandmother made one for everyone she meant to keep."',
		'Ines sat down heavily. Outside, the wind had begun to work at the shutters.',
		'"Tell me," she said. "All of it. From the start."',
		'He filled the kettle, set it on the flame, and began.',
		'Chapter Four',
		'The story took three nights to tell, and Ines wrote none of it down. She did not need to. It settled into her the way the cold had, slowly and then all at once.',
		'On the fourth morning the ferry came early. She stood on the dock with her bag between her feet, as she had on the first evening, and found that she was not waiting to leave.',
		'Behind her, up the coast road, the lamp in the hall of the white house was already lit.',
	];

	const fileTitle = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();

	let breaks = new Map([[0, { title: '', useNext: false }]]);
	let undoStack = [];

	const clone = (map) => new Map([...map].map(([key, value]) => [key, { ...value }]));
	const starts = () => [...breaks.keys()].sort((a, b) => a - b);

	function range(start) {
		const all = starts();
		const next = all[all.indexOf(start) + 1];

		return { first: start, last: next === undefined ? paragraphs.length : next };
	}

	function titleOf(start, number) {
		const info = breaks.get(start);

		if (info.useNext) return paragraphs[start];

		return info.title.trim() || 'Chapter ' + number;
	}

	function remember() {
		undoStack.push(clone(breaks));
		undoButton.disabled = false;
	}

	function words(first, last) {
		return paragraphs.slice(first, last).join(' ').split(/\s+/).filter(Boolean).length;
	}

	function renderText() {
		const all = starts();
		const nodes = [];

		paragraphs.forEach((paragraph, index) => {
			const info = breaks.get(index);
			const number = all.indexOf(index) + 1;

			if (info) {
				const { first, last } = range(index);
				const divider = document.createElement('div');
				const label = document.createElement('span');
				const name = document.createElement('span');
				const actions = document.createElement('span');
				const title = document.createElement('button');

				divider.className = 'split-break';
				divider.dataset.start = index;
				label.className = 'split-break-label';
				label.textContent = 'Chapter ' + number + ' starts here';
				name.className = 'split-break-title';
				name.textContent = titleOf(index, number);
				actions.className = 'split-break-actions';

				title.type = 'button';
				title.className = 'tool';
				title.dataset.toggleTitle = index;
				title.textContent = info.useNext ? 'Use a typed title' : 'Use next line as title';
				title.disabled = !info.useNext && last - first < 2;
				actions.append(title);

				if (index > 0) {
					const remove = document.createElement('button');

					remove.type = 'button';
					remove.className = 'tool';
					remove.dataset.remove = index;
					remove.textContent = 'Remove break';
					actions.append(remove);
				}

				divider.append(label, name, actions);
				nodes.push(divider);
			} else {
				const marker = document.createElement('button');

				marker.type = 'button';
				marker.className = 'split-marker';
				marker.dataset.add = index;
				marker.textContent = 'Start a chapter here';
				marker.setAttribute('aria-label', 'Start a new chapter before: ' + paragraph.slice(0, 40));
				nodes.push(marker);
			}

			const block = document.createElement('p');

			block.className = 'split-paragraph';
			block.textContent = paragraph;

			if (info && info.useNext) block.classList.add('is-title');

			nodes.push(block);
		});

		text.replaceChildren(...nodes);
	}

	function renderList() {
		const all = starts();

		list.replaceChildren(...all.map((start, position) => {
			const info = breaks.get(start);
			const { first, last } = range(start);
			const item = document.createElement('li');
			const jump = document.createElement('button');
			const input = document.createElement('input');
			const meta = document.createElement('span');

			item.className = 'split-item';
			jump.type = 'button';
			jump.className = 'split-jump';
			jump.dataset.jump = start;
			jump.textContent = position + 1;
			jump.setAttribute('aria-label', 'Go to chapter ' + (position + 1));

			input.className = 'input split-title-input';
			input.type = 'text';
			input.dataset.start = start;
			input.maxLength = 120;
			input.autocomplete = 'off';
			input.setAttribute('aria-label', 'Title of chapter ' + (position + 1));
			input.placeholder = 'Chapter ' + (position + 1);
			input.value = info.useNext ? paragraphs[start] : info.title;
			input.disabled = info.useNext;

			meta.className = 'split-meta';
			meta.textContent = words(first + (info.useNext ? 1 : 0), last).toLocaleString('en-US') + ' words';

			item.append(jump, input, meta);

			return item;
		}));

		count.textContent = all.length + (all.length === 1 ? ' chapter' : ' chapters');
		doneButton.textContent = 'Done splitting · ' + count.textContent;
		clearButton.disabled = breaks.size === 1;
		undoButton.disabled = undoStack.length === 0;
	}

	function render() {
		renderText();
		renderList();
	}

	function focusSelector(selector) {
		const target = $(selector, split);

		if (target) target.focus({ preventScroll: false });
	}

	text.addEventListener('click', (event) => {
		const add = event.target.closest('[data-add]');
		const remove = event.target.closest('[data-remove]');
		const title = event.target.closest('[data-toggle-title]');

		if (add) {
			const index = Number(add.dataset.add);

			remember();
			breaks.set(index, { title: '', useNext: false });
			render();
			focusSelector('[data-remove="' + index + '"]');
			announce('Chapter ' + (starts().indexOf(index) + 1) + ' starts here. ' + breaks.size + ' chapters.');
		} else if (remove) {
			const index = Number(remove.dataset.remove);

			remember();
			breaks.delete(index);
			render();
			focusSelector('[data-add="' + index + '"]');
			announce('Break removed. ' + breaks.size + (breaks.size === 1 ? ' chapter.' : ' chapters.'));
		} else if (title) {
			const index = Number(title.dataset.toggleTitle);

			remember();
			breaks.get(index).useNext = !breaks.get(index).useNext;
			render();
			focusSelector('[data-toggle-title="' + index + '"]');
		}
	});

	// Typing a title in the list updates the break without redrawing, so focus stays put
	list.addEventListener('input', (event) => {
		const input = event.target.closest('.split-title-input');
		if (!input) return;

		const start = Number(input.dataset.start);
		const number = starts().indexOf(start) + 1;

		breaks.get(start).title = input.value;
		$('.split-break[data-start="' + start + '"] .split-break-title', text).textContent = titleOf(start, number);
	});

	list.addEventListener('click', (event) => {
		const jump = event.target.closest('[data-jump]');
		if (!jump) return;

		const divider = $('.split-break[data-start="' + jump.dataset.jump + '"]', text);

		if (divider) divider.scrollIntoView({ block: 'start' });
		if (narrow.matches) setOpen(false);
	});

	undoButton.addEventListener('click', () => {
		if (!undoStack.length) return;

		breaks = undoStack.pop();
		render();
		announce('Undone. ' + breaks.size + (breaks.size === 1 ? ' chapter.' : ' chapters.'));
	});

	clearButton.addEventListener('click', () => {
		remember();
		breaks = new Map([[0, breaks.get(0)]]);
		render();
		announce('All breaks cleared. 1 chapter.');
	});

	// Chapters panel: a column on wide screens, a drawer on narrow ones
	function setOpen(open) {
		panel.hidden = !open;
		scrim.hidden = !(open && narrow.matches);
		toggle.setAttribute('aria-expanded', String(open));
	}

	toggle.addEventListener('click', () => setOpen(panel.hidden));
	scrim.addEventListener('click', () => setOpen(false));
	narrow.addEventListener('change', () => setOpen(!narrow.matches));

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !split.hidden && narrow.matches && !panel.hidden && !$('dialog[open]')) {
			setOpen(false);
			toggle.focus();
		}
	});

	// Help
	const helpDialog = $('[data-split-help-dialog]');
	const helpButton = $('[data-open-split-help]');

	helpButton.addEventListener('click', () => helpDialog.showModal());
	$$('[data-close-dialog]', helpDialog).forEach((button) => button.addEventListener('click', () => helpDialog.close()));
	helpDialog.addEventListener('click', (event) => {
		if (event.target === helpDialog) helpDialog.close();
	});
	helpDialog.addEventListener('close', () => helpButton.focus());

	// Finish: turn the breaks into chapters and hand them to the editor
	doneButton.addEventListener('click', () => {
		const chapters = starts().map((start, position) => {
			const info = breaks.get(start);
			const { first, last } = range(start);
			const bodyFrom = first + (info.useNext ? 1 : 0);

			return {
				title: titleOf(start, position + 1),
				body: paragraphs.slice(bodyFrom, last).join('\n\n'),
				published: false,
			};
		});

		split.hidden = true;
		workspace.hidden = false;
		$('.skip-link').setAttribute('href', '#main');
		window.history.replaceState(null, '', 'write.html');
		window.writeApi.finishImport(fileTitle, chapters);
		$('#chapter-title').focus();
	});

	// Start
	workspace.hidden = true;
	split.hidden = false;
	$('.skip-link').setAttribute('href', '#split-main');
	document.title = 'Split into chapters · Duolum';
	setOpen(!narrow.matches);
	render();
	main.focus();
})();