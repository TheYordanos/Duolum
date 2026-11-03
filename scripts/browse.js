(() => {
	const form = $('[data-filter-form]');
	if (!form) return;

	const params = new URLSearchParams(location.search);

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
	const empty = $('[data-empty]');
	if (!empty || !params.has('empty')) return;

	const noun = $('[data-count]').dataset.noun === 'book' ? 'books' : 'people';
	const filterNames = ['q', 'genre'];
	const isFiltered = filterNames.some((name) => params.get(name));
	const clear = $('[data-empty-clear]', empty);

	$$('[data-results]').forEach((element) => {
		element.hidden = true;
	});

	$('[data-count]').textContent = '0 ' + noun;

	$('.empty-state-title', empty).textContent = isFiltered ? 'No ' + noun + ' match your search' : 'No ' + noun + ' yet';
	$('.empty-state-text', empty).textContent = isFiltered
		? (noun === 'books' ? 'Try a different word, or remove some of the filters.' : 'Check the spelling or try a different name.')
		: (noun === 'books' ? 'Books will show up here as writers publish them.' : 'People will show up here as they join Duolum.');

	clear.textContent = noun === 'books' ? 'Clear filters' : 'Clear search';
	clear.hidden = !isFiltered;
	empty.hidden = false;
})();
