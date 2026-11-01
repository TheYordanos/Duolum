(() => {
	const button = $('[data-want-toggle]');
	if (!button) return;

	button.addEventListener('click', () => {
		const isOnList = button.dataset.onList !== 'true';

		button.dataset.onList = String(isOnList);
		button.textContent = isOnList ? 'On your list' : 'Want to read';
		button.classList.toggle('button-primary', isOnList);
	});
})();
