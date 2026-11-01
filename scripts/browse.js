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
})();
