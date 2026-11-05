// Light or dark. Light is the default. Loaded in <head> so the saved theme is applied before the page paints.
(() => {
	const KEY = 'duolum-theme';
	const root = document.documentElement;

	function stored() {
		try {
			return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
		} catch (error) {
			return 'light';
		}
	}

	function apply(theme) {
		root.dataset.theme = theme;

		document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
			const dark = theme === 'dark';
			const state = button.querySelector('[data-theme-state]');

			button.setAttribute('aria-pressed', String(dark));
			if (state) state.textContent = dark ? 'On' : 'Off';
		});
	}

	apply(stored());

	document.addEventListener('DOMContentLoaded', () => {
		apply(root.dataset.theme);

		document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
			button.addEventListener('click', () => {
				const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

				try {
					localStorage.setItem(KEY, next);
				} catch (error) {
					// The theme then only lasts for this page
				}

				apply(next);
			});
		});
	});

	// Another tab changed it
	window.addEventListener('storage', (event) => {
		if (event.key === KEY) apply(stored());
	});
})();