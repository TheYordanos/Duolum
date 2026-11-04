(() => {
	// The page is chosen by the address: auth.html?mode=login | signup | forgot
	const TITLES = { login: 'Log in', signup: 'Create account', forgot: 'Reset password' };
	const requested = new URLSearchParams(location.search).get('mode');
	const mode = requested in TITLES ? requested : 'login';

	$$('[data-view]').forEach((view) => {
		view.hidden = view.dataset.view !== mode;
	});

	document.title = TITLES[mode] + ' \u00b7 Duolum';

	$$('[data-show-password]').forEach((toggle) => {
		toggle.addEventListener('change', () => {
			$$('[data-password]', toggle.closest('form')).forEach((input) => {
				input.type = toggle.checked ? 'text' : 'password';
			});
		});
	});

	// Frontend-only stand-in for the server response. Remove once there is a backend.
	$$('.auth-form').forEach((form) => {
		form.addEventListener('submit', (event) => {
			event.preventDefault();

			if (mode === 'forgot') {
				form.hidden = true;
				$('[data-forgot-sent]').hidden = false;
				return;
			}

			location.href = 'browse.html';
		});
	});
})();