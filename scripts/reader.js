(() => {
	const STORAGE_KEY = 'duolum-reader';
	const THEMES = ['light', 'sepia', 'dark'];
	const FONTS = ['serif', 'sans'];
	const SIZE = { min: 15, max: 26, fallback: 19 };
	const GATES = ['sample', 'supporters'];

	const root = document.documentElement;
	const settingsToggle = $('#settings-toggle');
	const settingsPanel = $('#reader-settings');
	const contentsToggle = $('#contents-toggle');
	const drawer = $('#contents-drawer');
	const sizeValue = $('#size-value');
	const sizeButtons = $$('[data-size-step]');
	const fontButtons = $$('[data-font-option]');
	const themeButtons = $$('[data-theme-option]');
	const article = $('.reader-article');
	const progressFill = $('.reader-progress-fill');

	function load() {
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
		} catch (error) {
			return {};
		}
	}

	function save() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		} catch (error) {
			// Storage can be unavailable (private windows, blocked cookies); the settings just won't persist
		}
	}

	const stored = load();
	const settings = {
		theme: THEMES.includes(stored.theme) ? stored.theme : 'light',
		font: FONTS.includes(stored.font) ? stored.font : 'serif',
		size: stored.size >= SIZE.min && stored.size <= SIZE.max ? Number(stored.size) : SIZE.fallback,
	};

	function apply() {
		root.dataset.readerTheme = settings.theme;
		root.dataset.readerFont = settings.font;
		root.style.setProperty('--reader-size', settings.size + 'px');

		sizeValue.textContent = settings.size;

		sizeButtons.forEach((button) => {
			const next = settings.size + Number(button.dataset.sizeStep);
			button.disabled = next < SIZE.min || next > SIZE.max;
		});

		fontButtons.forEach((button) => {
			button.setAttribute('aria-pressed', String(button.dataset.fontOption === settings.font));
		});

		themeButtons.forEach((button) => {
			button.setAttribute('aria-pressed', String(button.dataset.themeOption === settings.theme));
		});

		updateProgress();
	}

	function change(key, value) {
		settings[key] = value;
		save();
		apply();
	}

	sizeButtons.forEach((button) => {
		button.addEventListener('click', () => change('size', settings.size + Number(button.dataset.sizeStep)));
	});

	fontButtons.forEach((button) => {
		button.addEventListener('click', () => change('font', button.dataset.fontOption));
	});

	themeButtons.forEach((button) => {
		button.addEventListener('click', () => change('theme', button.dataset.themeOption));
	});

	function setSettingsOpen(isOpen, { returnFocus = false } = {}) {
		settingsPanel.hidden = !isOpen;
		settingsToggle.setAttribute('aria-expanded', String(isOpen));

		if (!isOpen && returnFocus) settingsToggle.focus();
	}

	settingsToggle.addEventListener('click', () => setSettingsOpen(settingsPanel.hidden));

	document.addEventListener('click', (event) => {
		if (settingsPanel.hidden) return;
		if (event.target.closest('#reader-settings, #settings-toggle')) return;

		setSettingsOpen(false);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !settingsPanel.hidden) setSettingsOpen(false, { returnFocus: true });
	});

	contentsToggle.addEventListener('click', () => {
		setSettingsOpen(false);
		drawer.showModal();
	});

	$('[data-close-drawer]').addEventListener('click', () => drawer.close());

	drawer.addEventListener('click', (event) => {
		if (event.target === drawer) drawer.close();
	});

	function updateProgress() {
		const rect = article.getBoundingClientRect();
		const scrollable = rect.height - window.innerHeight;
		const read = Math.min(Math.max(-rect.top, 0), Math.max(scrollable, 1));
		const ratio = scrollable > 0 ? read / scrollable : 1;

		progressFill.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
	}

	window.addEventListener('scroll', updateProgress, { passive: true });
	window.addEventListener('resize', updateProgress);

	// Demo of the states the server will decide later: ?access=sample, ?access=supporters or ?end
	const params = new URLSearchParams(location.search);
	const access = params.get('access');

	if (GATES.includes(access)) {
		article.classList.add('is-gated');
		$('[data-access-gate="' + access + '"]').hidden = false;
		$('.chapter-nav').hidden = true;
	}

	if (params.has('end')) {
		$('[data-book-end]').hidden = false;
		$('.chapter-nav-link[rel="next"]').hidden = true;
	}

	$('[data-finish-toggle]').addEventListener('click', (event) => {
		const button = event.currentTarget;
		const isFinished = button.getAttribute('aria-pressed') !== 'true';

		button.setAttribute('aria-pressed', String(isFinished));
		button.textContent = isFinished ? 'Finished' : 'Mark as finished';
		button.classList.toggle('button-primary', !isFinished);
	});

	apply();
})();
