(() => {
	const tablist = $('[role="tablist"]');
	const panels = $$('[role="tabpanel"]');
	let ready = false;

	const controller = initTabs(tablist, (tab) => {
		panels.forEach((panel) => {
			panel.hidden = panel.id !== tab.getAttribute('aria-controls');
		});

		if (!ready) return;

		try {
			history.replaceState(null, '', '#' + tab.dataset.tab);
		} catch (error) {
			// Some contexts (for example sandboxed frames) refuse to change the URL
		}
	});

	const initial = controller.tabs.find((tab) => tab.dataset.tab === location.hash.slice(1));

	if (initial) controller.select(initial);

	ready = true;

	$$('[data-tab-link]').forEach((link) => {
		link.addEventListener('click', () => {
			const tab = controller.tabs.find((item) => item.dataset.tab === link.dataset.tabLink);

			if (tab) controller.select(tab, { focus: true });
		});
	});


	// Demo of a brand-new account until there is real data: add ?empty to the address
	if (new URLSearchParams(location.search).has('empty')) {
		$$('[data-filled]').forEach((element) => {
			element.hidden = true;
		});

		$$('[data-empty]').forEach((element) => {
			element.hidden = false;
		});

		$$('.stat-value').forEach((element) => {
			element.textContent = '0';
		});
	}
})();

// Settings
(() => {
	const form = $('[data-settings-form]');
	const status = $('[data-settings-status]');
	const fields = form.elements;
	const bioCount = $('[data-bio-count]');
	const HANDLE = /^[a-z0-9_]{3,20}$/i;
	const SITE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;
	const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let statusTimer = null;
	let saved = '';

	const snapshot = () => JSON.stringify([...new FormData(form)].concat($$('input[type="checkbox"]', form).map((box) => [box.name, box.checked])));

	function showError(name, message) {
		const error = $('#settings-' + name + '-error');
		const input = fields[name];

		if (!error) return;

		error.textContent = message;
		error.hidden = !message;
		input.setAttribute('aria-invalid', String(Boolean(message)));
	}

	function updateBioCount() {
		bioCount.textContent = fields.bio.value.length + ' / 160';
	}

	function validate() {
		const name = fields.name.value.trim();
		const handle = fields.handle.value.trim();
		const website = fields.website.value.trim();
		const problems = {
			name: name ? '' : 'Enter a display name.',
			handle: HANDLE.test(handle) ? '' : 'Use 3 to 20 letters, numbers or underscores.',
			website: !website || SITE.test(website) ? '' : 'Enter a web address like example.com.',
		};

		Object.entries(problems).forEach(([key, message]) => showError(key, message));

		const first = Object.keys(problems).find((key) => problems[key]);

		if (first) fields[first].focus();

		return !first;
	}

	form.addEventListener('submit', (event) => {
		event.preventDefault();

		if (!validate()) return;

		const name = fields.name.value.trim();
		const handle = fields.handle.value.trim().toLowerCase();
		const website = fields.website.value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');

		fields.handle.value = handle;
		fields.website.value = website;

		// The profile header above shows the saved details straight away
		$('[data-head-name]').textContent = name;
		$('[data-head-handle]').textContent = '@' + handle;
		$('[data-head-bio]').textContent = fields.bio.value.trim();
		$('[data-head-photo]').alt = name;
		$('[data-head-website-item]').hidden = !website;
		$('[data-head-website]').textContent = website;
		$('[data-head-website]').href = website ? 'https://' + website : '#';
		$('[data-delete-handle]').textContent = handle;

		saved = snapshot();
		status.textContent = 'Changes saved.';
		clearTimeout(statusTimer);
		statusTimer = setTimeout(() => {
			status.textContent = '';
		}, 3000);
	});

	form.addEventListener('input', (event) => {
		if (event.target === fields.bio) updateBioCount();
		if (event.target.name in { name: 1, handle: 1, website: 1 }) showError(event.target.name, '');

		status.textContent = '';
	});

	// Warn before leaving with changes that were not saved
	window.addEventListener('beforeunload', (event) => {
		if (snapshot() === saved) return;

		event.preventDefault();
		event.returnValue = '';
	});

	updateBioCount();
	saved = snapshot();

	// Dialogs
	function wire(dialog) {
		let trigger = null;

		$$('[data-open-dialog="' + dialog.id + '"], [data-open-photo]').forEach((button) => {
			const matches = button.dataset.openDialog === dialog.id || (dialog.id === 'photo-dialog' && button.hasAttribute('data-open-photo'));

			if (!matches) return;

			button.addEventListener('click', () => {
				trigger = button;
				dialog.showModal();
			});
		});

		$$('[data-close-dialog]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));

		dialog.addEventListener('click', (event) => {
			if (event.target === dialog) dialog.close();
		});

		dialog.addEventListener('close', () => {
			$$('form', dialog).forEach((item) => item.reset());
			$$('[data-error]', dialog).forEach((error) => {
				error.hidden = true;
			});
			$$('[aria-invalid]', dialog).forEach((input) => input.removeAttribute('aria-invalid'));
			if (trigger) trigger.focus();
		});

		return dialog;
	}

	function dialogError(dialog, key, message) {
		const error = $('[data-error="' + key + '"]', dialog);
		const input = $('[name="' + key + '"]', dialog);

		error.textContent = message;
		error.hidden = !message;
		if (input) input.setAttribute('aria-invalid', String(Boolean(message)));

		return Boolean(message);
	}

	// Photo
	const photoDialog = wire($('#photo-dialog'));
	const photoInput = $('[data-photo-input]');
	const photoError = $('[data-photo-error]');
	const photoPreview = $('[data-photo-preview]');
	const photoSave = $('[data-photo-save]');
	const originalPhoto = photoPreview.src;
	let chosen = null;

	photoInput.addEventListener('change', () => {
		const file = photoInput.files[0];

		if (!file) return;

		const okType = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
		const okSize = file.size <= 5 * 1024 * 1024;

		photoError.hidden = okType && okSize;
		photoError.textContent = !okType ? 'Choose a PNG, JPG or WebP image.' : 'That image is over 5 MB. Choose a smaller one.';
		photoInput.value = '';

		if (!okType || !okSize) return;

		chosen = URL.createObjectURL(file);
		photoPreview.src = chosen;
		photoSave.disabled = false;
	});

	photoSave.addEventListener('click', () => {
		$$('[data-settings-photo], [data-head-photo]').forEach((image) => {
			image.src = chosen;
		});

		photoDialog.close();
		status.textContent = 'Photo updated.';
	});

	photoDialog.addEventListener('close', () => {
		photoSave.disabled = true;
		photoError.hidden = true;
		photoPreview.src = $('[data-head-photo]').src || originalPhoto;
	});

	// Email and password
	const emailDialog = wire($('#email-dialog'));
	const passwordDialog = wire($('#password-dialog'));

	$('[data-account-form="email"]').addEventListener('submit', (event) => {
		event.preventDefault();

		const data = new FormData(event.target);
		const email = String(data.get('email')).trim();
		const badEmail = dialogError(emailDialog, 'email', EMAIL.test(email) ? '' : 'Enter a valid email address.');
		const badPassword = dialogError(emailDialog, 'password', data.get('password') ? '' : 'Enter your current password.');

		if (badEmail || badPassword) return;

		$('[data-account-email]').textContent = email + ' (waiting for you to confirm)';
		emailDialog.close();
		announce('We sent a confirmation link to ' + email + '.');
	});

	$('[data-account-form="password"]').addEventListener('submit', (event) => {
		event.preventDefault();

		const data = new FormData(event.target);
		const problems = [
			dialogError(passwordDialog, 'current', data.get('current') ? '' : 'Enter your current password.'),
			dialogError(passwordDialog, 'password', String(data.get('password')).length >= 8 ? '' : 'Use at least 8 characters.'),
			dialogError(passwordDialog, 'confirm', data.get('confirm') === data.get('password') ? '' : 'The passwords don\u2019t match.'),
		];

		if (problems.some(Boolean)) return;

		$('.account-row:nth-child(2) .account-value').textContent = 'Last changed just now';
		passwordDialog.close();
		announce('Password changed.');
	});

	// Download data
	const exportButton = $('[data-request-export]');

	exportButton.addEventListener('click', () => {
		$('[data-export-text]').textContent = 'Requested. We\u2019ll email you a link when your download is ready.';
		exportButton.textContent = 'Requested';
		exportButton.disabled = true;
		announce('Download requested.');
	});

	// Delete account: the handle must be typed to unlock the button
	const deleteDialog = wire($('#delete-account-dialog'));
	const deleteInput = $('#delete-confirm');
	const deleteLink = $('[data-delete-confirm]');

	deleteInput.addEventListener('input', () => {
		const match = deleteInput.value.trim().toLowerCase() === $('[data-delete-handle]').textContent;

		deleteLink.setAttribute('aria-disabled', String(!match));
	});

	deleteLink.addEventListener('click', (event) => {
		if (deleteLink.getAttribute('aria-disabled') === 'true') event.preventDefault();
	});

	deleteDialog.addEventListener('close', () => deleteLink.setAttribute('aria-disabled', 'true'));
})();

// The Favorites stat follows the shared favourites list
(() => {
	const count = $('[data-favorites-count]');

	if (!count) return;

	const update = () => {
		count.textContent = getFavorites().size;
	};

	document.addEventListener('DOMContentLoaded', update);
	document.addEventListener('favorites:change', update);
})();

// Blocked people: listed in Settings, unblocked in one click
(() => {
	const list = $('[data-blocked-list]');
	const empty = $('[data-blocked-empty]');
	if (!list) return;

	function render() {
		const people = [...getBlocked()].filter((id) => window.getPerson && window.getPerson(id));

		list.replaceChildren(...people.map((id) => {
			const person = window.getPerson(id);
			const item = document.createElement('li');
			const avatar = document.createElement('img');
			const text = document.createElement('div');
			const name = document.createElement('strong');
			const handle = document.createElement('span');
			const view = document.createElement('button');
			const unblock = document.createElement('button');

			item.className = 'blocked-item';
			avatar.className = 'avatar';
			avatar.src = 'imgs/profile.jpg';
			avatar.alt = '';
			name.textContent = person.name;
			handle.textContent = '@' + person.handle;
			text.append(name, handle);

			view.className = 'button button-small';
			view.type = 'button';
			view.dataset.profile = id;
			view.textContent = 'View profile';

			unblock.className = 'button button-small';
			unblock.type = 'button';
			unblock.textContent = 'Unblock';
			unblock.setAttribute('aria-label', 'Unblock ' + person.name);
			unblock.addEventListener('click', () => {
				setBlocked(id, false);
				announce(person.name + ' unblocked.');
			});

			item.append(avatar, text, view, unblock);

			return item;
		}));

		list.hidden = people.length === 0;
		empty.hidden = people.length > 0;
	}

	render();
	document.addEventListener('blocks:change', render);
})();