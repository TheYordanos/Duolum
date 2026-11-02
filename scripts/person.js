(() => {
	const button = $('[data-support-toggle]');
	if (!button) return;

	button.addEventListener('click', () => {
		const isSupporting = button.dataset.supporting !== 'true';

		button.dataset.supporting = String(isSupporting);
		button.textContent = isSupporting ? 'Supporting' : 'Support';
		button.classList.toggle('button-primary', !isSupporting);
	});
})();

(() => {
	const params = new URLSearchParams(location.search);

	// Demo of a person with no books yet until there is real data: add ?empty to the address
	if (params.has('empty')) {
		$('[data-filled]').hidden = true;
		$('[data-empty]').hidden = false;
	}

	// Demo of a person who has turned supporter payments off: add ?support=off
	if (params.get('support') === 'off') {
		$('.support-card').hidden = true;
		$('[data-supporters-stat]').hidden = true;
	}
})();