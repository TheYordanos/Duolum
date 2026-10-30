const navItems = document.querySelectorAll('.nav-item');

navItems.forEach((item) => {
	item.addEventListener('click', () => {

		// Remove active state from all tabs
		navItems.forEach((nav) => {
			nav.classList.remove('active');
		});

		// Activate clicked tab
		item.classList.add('active');

	});
});
