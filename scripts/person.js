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
