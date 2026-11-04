// A small Markdown renderer for the writing preview. Covers what the Markdown help promises:
// headings, bold, italic, links, quotes, lists, scene breaks, code. The backend will render the real thing.
function renderMarkdown(source) {
	const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

	const safeUrl = (url) => (/^(https?:|mailto:|\/|#|[\w./-]+$)/i.test(url.trim()) ? url.trim() : '#');

	function inline(text) {
		const codes = [];

		let html = escapeHtml(text).replace(/`([^`]+)`/g, (match, code) => {
			codes.push('<code>' + code + '</code>');

			return '\u0000' + (codes.length - 1) + '\u0000';
		});

		html = html
			.replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, (match, character) => '&#' + character.charCodeAt(0) + ';')
			.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => '<a href="' + safeUrl(url) + '" rel="noopener nofollow ugc">' + label + '</a>')
			.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>')
			.replace(/(\*|_)(?=\S)([\s\S]*?\S)\1/g, '<em>$2</em>');

		return html.replace(/\u0000(\d+)\u0000/g, (match, index) => codes[Number(index)]);
	}

	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const out = [];
	let paragraph = [];
	let i = 0;

	const flush = () => {
		if (paragraph.length) out.push('<p>' + inline(paragraph.join(' ')) + '</p>');
		paragraph = [];
	};

	while (i < lines.length) {
		const line = lines[i];

		if (/^\s*$/.test(line)) {
			flush();
			i += 1;
			continue;
		}

		if (/^\s*(```|~~~)/.test(line)) {
			flush();

			const code = [];

			i += 1;

			while (i < lines.length && !/^\s*(```|~~~)/.test(lines[i])) {
				code.push(lines[i]);
				i += 1;
			}

			i += 1;
			out.push('<pre tabindex="0"><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
			continue;
		}

		const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);

		if (heading) {
			flush();

			const level = Math.min(heading[1].length + 1, 4);

			out.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>');
			i += 1;
			continue;
		}

		if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
			flush();
			out.push('<hr>');
			i += 1;
			continue;
		}

		if (/^\s{0,3}>/.test(line)) {
			flush();

			const quote = [];

			while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
				quote.push(lines[i].replace(/^\s{0,3}>\s?/, ''));
				i += 1;
			}

			out.push('<blockquote>' + renderMarkdown(quote.join('\n')) + '</blockquote>');
			continue;
		}

		const listMatch = line.match(/^\s{0,3}([-*+]|\d+[.)])\s+/);

		if (listMatch) {
			flush();

			const ordered = /\d/.test(listMatch[1]);
			const itemPattern = ordered ? /^\s{0,3}\d+[.)]\s+(.*)$/ : /^\s{0,3}[-*+]\s+(.*)$/;
			const items = [];

			while (i < lines.length) {
				const item = lines[i].match(itemPattern);

				if (item) {
					items.push(item[1]);
				} else if (/^\s{2,}\S/.test(lines[i]) && items.length) {
					items[items.length - 1] += ' ' + lines[i].trim();
				} else {
					break;
				}

				i += 1;
			}

			const tag = ordered ? 'ol' : 'ul';

			out.push('<' + tag + '>' + items.map((item) => '<li>' + inline(item) + '</li>').join('') + '</' + tag + '>');
			continue;
		}

		paragraph.push(line.trim());
		i += 1;
	}

	flush();

	return out.join('\n');
}