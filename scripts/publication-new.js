(() => {
	const ALLOWED = ['docx', 'epub', 'md', 'markdown', 'txt'];

	const input = $('input[type="file"]');
	const error = $('#upload-error');
	if (!input) return;

	input.addEventListener('change', () => {
		const file = input.files[0];
		if (!file) return;

		const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';

		if (!ALLOWED.includes(extension)) {
			error.textContent = 'That file type isn’t supported. Choose a DOCX, EPUB, Markdown or TXT file.';
			error.hidden = false;
			input.value = '';
			return;
		}

		error.hidden = true;

		const params = new URLSearchParams({ name: file.name, size: file.size });

		location.href = 'publication-review.html?' + params.toString();
	});
})();
