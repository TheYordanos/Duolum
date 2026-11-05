// Report and block. Block lives in localStorage until there is an account; a report is only acknowledged for now.
(() => {
	const blockDialog = $('[data-block-dialog]');
	const reportDialog = $('[data-report-dialog]');
	if (!blockDialog || !reportDialog) return;

	const names = {};
	let blockId = null;
	let reportId = null;
	let opener = null;

	// A person's name: from the profile data when this page has it, otherwise from the trigger
	function nameFor(id, trigger) {
		if (trigger && trigger.dataset.personName) names[id] = trigger.dataset.personName;
		if (window.getPerson && window.getPerson(id)) return window.getPerson(id).name;

		return names[id] || 'this person';
	}

	function openDialog(dialog, trigger) {
		opener = trigger || null;
		if (!dialog.open) dialog.showModal();
	}

	// Block

	function openBlock(id, trigger) {
		const name = nameFor(id, trigger);
		const blocked = isBlocked(id);

		blockId = id;
		$('[data-block-title]', blockDialog).textContent = (blocked ? 'Unblock ' : 'Block ') + name + '?';
		$('[data-block-text]', blockDialog).textContent = blocked
			? name + ' will be able to see your profile and message you again.'
			: name + ' won’t be able to message you or follow you, and you won’t see them in Browse or your Following feed. You can unblock them any time from their profile.';
		$('[data-block-confirm]', blockDialog).textContent = blocked ? 'Unblock' : 'Block';

		openDialog(blockDialog, trigger);
	}

	$('[data-block-confirm]', blockDialog).addEventListener('click', () => {
		const name = nameFor(blockId);
		const on = !isBlocked(blockId);

		setBlocked(blockId, on);
		blockDialog.close();
		announce(on ? name + ' blocked.' : name + ' unblocked.');
	});

	// Report

	function openReport(id, trigger) {
		reportId = id;
		$('[data-report-title]', reportDialog).textContent = 'Report ' + nameFor(id, trigger);
		$('form', reportDialog).reset();
		$('[data-report-error]', reportDialog).hidden = true;

		openDialog(reportDialog, trigger);
	}

	$('form', reportDialog).addEventListener('submit', (event) => {
		event.preventDefault();

		if (!$('input[name="reason"]:checked', reportDialog)) {
			$('[data-report-error]', reportDialog).hidden = false;
			return;
		}

		const name = nameFor(reportId);

		reportDialog.close();
		announce('Report sent. Thanks for letting us know about ' + name + '.');
	});

	document.addEventListener('click', (event) => {
		const block = event.target.closest('[data-block-person]');
		const report = event.target.closest('[data-report-person]');

		if (block) openBlock(block.dataset.blockPerson, block);
		if (report) openReport(report.dataset.reportPerson, report);
	});

	[blockDialog, reportDialog].forEach((dialog) => {
		$$('[data-close-dialog]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));

		dialog.addEventListener('click', (event) => {
			if (event.target === dialog) dialog.close();
		});

		dialog.addEventListener('close', () => {
			if (opener && document.contains(opener) && !opener.closest('[hidden]')) opener.focus();
			opener = null;
		});
	});

	// Hide blocked people wherever a card, row or feed item belongs to them
	function applyBlocks() {
		const blocked = getBlocked();

		$$('.person-card, .book-card[data-person]').forEach((item) => {
			const owner = item.dataset.person || item.querySelector('[data-profile]')?.dataset.profile;

			item.classList.toggle('is-blocked', blocked.has(owner));
		});

		$$('.person-item[data-person]').forEach((item) => {
			if (item.dataset.person === 'all') return;
			item.closest('li').classList.toggle('is-blocked', blocked.has(item.dataset.person));
		});
	}

	applyBlocks();
	document.addEventListener('blocks:change', applyBlocks);
})();