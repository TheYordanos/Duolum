(() => {
	const params = new URLSearchParams(location.search);

	// The page is chosen by the address: browse.html (books) or browse.html?mode=people
	const mode = params.get('mode') === 'people' ? 'people' : 'books';
	const section = $('[data-mode="' + mode + '"]');

	$$('[data-mode]').forEach((element) => {
		element.hidden = element !== section;
	});

	$$('[data-segment]').forEach((link) => {
		const isActive = link.dataset.segment === mode;

		link.classList.toggle('active', isActive);

		if (isActive) {
			link.setAttribute('aria-current', 'page');
		} else {
			link.removeAttribute('aria-current');
		}
	});

	document.title = (mode === 'people' ? 'Browse people' : 'Browse books') + ' \u00b7 Duolum';

	const form = $('[data-filter-form]', section);

	[...form.elements].forEach((control) => {
		if (control.name && params.has(control.name)) {
			control.value = params.get(control.name);
		}
	});

	form.addEventListener('change', (event) => {
		if (!event.target.matches('select')) return;

		if (form.requestSubmit) {
			form.requestSubmit();
		} else {
			form.submit();
		}
	});

	// Demo of the "nothing found" state until there is a real search: add ?empty to the address.
	// With a search or filter in use it says nothing matched; with none, there is nothing to show at all.
	const empty = $('[data-empty]', section);
	if (!params.has('empty')) return;

	const noun = mode === 'books' ? 'books' : 'people';
	const isFiltered = ['q', 'genre'].some((name) => params.get(name));
	const clear = $('[data-empty-clear]', empty);

	$$('[data-results]', section).forEach((element) => {
		element.hidden = true;
	});

	$('[data-count]', section).textContent = '0 ' + noun;

	$('.empty-state-title', empty).textContent = isFiltered ? 'No ' + noun + ' match your search' : 'No ' + noun + ' yet';
	$('.empty-state-text', empty).textContent = isFiltered
		? (mode === 'books' ? 'Try a different word, or remove some of the filters.' : 'Check the spelling or try a different name.')
		: (mode === 'books' ? 'Books will show up here as writers publish them.' : 'People will show up here as they join Duolum.');

	clear.textContent = mode === 'books' ? 'Clear filters' : 'Clear search';
	clear.hidden = !isFiltered;
	empty.hidden = false;
})();