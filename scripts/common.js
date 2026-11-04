const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function initTabs(tablist, onSelect = () => {}) {
	const tabs = $$('[role="tab"]', tablist);

	function select(tab, { focus = false } = {}) {
		tabs.forEach((item) => {
			const isActive = item === tab;

			item.classList.toggle('active', isActive);
			item.setAttribute('aria-selected', String(isActive));
			item.tabIndex = isActive ? 0 : -1;
		});

		if (focus) tab.focus();

		onSelect(tab);
	}

	tabs.forEach((tab, index) => {
		tab.addEventListener('click', () => select(tab));

		tab.addEventListener('keydown', (event) => {
			const last = tabs.length - 1;
			const targets = {
				ArrowRight: index === last ? 0 : index + 1,
				ArrowLeft: index === 0 ? last : index - 1,
				Home: 0,
				End: last,
			};

			if (!(event.key in targets)) return;

			event.preventDefault();
			select(tabs[targets[event.key]], { focus: true });
		});
	});

	select(tabs.find((tab) => tab.classList.contains('active')) || tabs[0]);

	return { tabs, select };
}

function setFollowing(button, isFollowing) {
	button.dataset.following = String(isFollowing);
	button.textContent = isFollowing ? 'Following' : 'Follow';
	button.classList.toggle('button-primary', !isFollowing);
}

document.addEventListener('click', (event) => {
	const back = event.target.closest('[data-back]');

	if (back && history.length > 1) {
		event.preventDefault();
		history.back();
		return;
	}

	const follow = event.target.closest('[data-follow-toggle]');

	if (follow) {
		setFollowing(follow, follow.dataset.following !== 'true');
	}
});

// Share buttons only copy a link to the page, they never open the device share sheet.
// Put the link in data-share-url (relative to the current page); without it the current page is used.
async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		const field = document.createElement('textarea');

		field.value = text;
		field.setAttribute('readonly', '');
		field.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
		document.body.appendChild(field);
		field.select();

		let copied = false;

		try {
			copied = document.execCommand('copy');
		} catch (fallbackError) {
			copied = false;
		}

		field.remove();

		return copied;
	}
}

function announce(message) {
	let region = $('[data-live-region]');

	if (!region) {
		region = document.createElement('p');
		region.className = 'visually-hidden';
		// Fixed to the top-left so it can never add scrollable height at the bottom of the page
		region.style.cssText = 'position:fixed;top:0;left:0';
		region.setAttribute('role', 'status');
		region.setAttribute('data-live-region', '');
		document.body.appendChild(region);
	}

	region.textContent = '';
	setTimeout(() => {
		region.textContent = message;
	}, 50);
}

document.addEventListener('click', async (event) => {
	const button = event.target.closest('[data-share]');
	if (!button) return;

	const url = new URL(button.dataset.shareUrl || location.href, location.href).href;
	const copied = await copyText(url);

	if (button.dataset.shareTimer) clearTimeout(Number(button.dataset.shareTimer));
	if (!button.dataset.shareLabel) button.dataset.shareLabel = button.textContent;

	button.textContent = copied ? 'Link copied' : 'Not copied';
	announce(copied ? 'Link copied to clipboard.' : 'Couldn\u2019t copy the link.');

	button.dataset.shareTimer = String(setTimeout(() => {
		button.textContent = button.dataset.shareLabel;
		delete button.dataset.shareLabel;
		delete button.dataset.shareTimer;
	}, 1800));
});

// Small screens: the sidebar becomes a slim bar whose Menu button opens the links
(() => {
	const toggle = $('[data-menu-toggle]');
	if (!toggle) return;

	const sidebar = toggle.closest('.sidebar');
	const wide = window.matchMedia('(min-width: 601px)');

	function setOpen(open, { focus = false } = {}) {
		sidebar.classList.toggle('menu-open', open);
		toggle.setAttribute('aria-expanded', String(open));
		if (focus) toggle.focus();
	}

	toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && sidebar.classList.contains('menu-open')) setOpen(false, { focus: true });
	});

	// Tapping anywhere outside the bar and its panel closes it
	document.addEventListener('click', (event) => {
		if (sidebar.classList.contains('menu-open') && !sidebar.contains(event.target)) setOpen(false);
	});

	wide.addEventListener('change', () => {
		if (wide.matches) setOpen(false);
	});
})();