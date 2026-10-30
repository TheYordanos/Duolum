const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('[data-page-section]');

function showPage(pageName) {
	pageSections.forEach((section) => {
		section.hidden = section.dataset.pageSection !== pageName;
	});

	navItems.forEach((item) => {
		const isActive = item.dataset.page === pageName;

		item.classList.toggle('active', isActive);
		item.setAttribute('aria-current', isActive ? 'page' : 'false');
	});
}

navItems.forEach((item) => {
	item.addEventListener('click', () => {
		showPage(item.dataset.page);
	});
});

const libraryTabs = document.querySelectorAll('.library-tab');
const libraryCards = document.querySelectorAll('.library-grid .book-card');

libraryTabs.forEach((tab) => {
	tab.addEventListener('click', () => {
		libraryTabs.forEach((item) => {
			item.classList.remove('active');
			item.setAttribute('aria-pressed', 'false');
		});

		tab.classList.add('active');
		tab.setAttribute('aria-pressed', 'true');

		const filter = tab.dataset.libraryFilter;

		libraryCards.forEach((card) => {
			const matchesFilter =
				filter === 'all' ||
				(filter === 'favorites' && card.dataset.favorite === 'true') ||
				card.dataset.bookStatus === filter;

			card.hidden = !matchesFilter;
		});
	});
});

showPage('browse');

const initialLibraryTab = document.querySelector('.library-tab.active');
if (initialLibraryTab) {
	initialLibraryTab.setAttribute('aria-pressed', 'true');
}
