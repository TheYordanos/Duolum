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
