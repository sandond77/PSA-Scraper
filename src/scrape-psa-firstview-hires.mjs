import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'patchright';

function parseArgs(argv) {
	const args = {};
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith('--')) {
			const key = a.slice(2);
			const val =
				argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
			args[key] = val;
		}
	}
	return args;
}

function expandRanges(rangesCsv) {
	const out = new Set();
	const parts = String(rangesCsv || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	for (const p of parts) {
		const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
		if (!m)
			throw new Error(`Bad range: "${p}" (expected like 127283889-127284082)`);
		const start = Number(m[1]);
		const end = Number(m[2]);
		if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
			throw new Error(`Invalid range: "${p}"`);
		}
		const width = m[1].length;
		for (let c = start; c <= end; c++) out.add(String(c).padStart(width, '0'));
	}
	return out;
}

async function waitForLargeImage(page, timeout = 30000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		const src = await page.evaluate(() => {
			const imgs = [...document.images]
				.map((img) => ({
					src: img.currentSrc || img.src || '',
					area: (img.naturalWidth || 0) * (img.naturalHeight || 0)
				}))
				.filter((i) => i.src && i.area > 200_000);

			if (!imgs.length) return null;
			imgs.sort((a, b) => b.area - a.area);
			return imgs[0].src;
		});

		if (src) return src;
		await page.waitForTimeout(300);
	}
	throw new Error('Timed out waiting for viewer image');
}

async function clickBackThumb(page) {
	const clicked = await page.evaluate(() => {
		const thumbs = [...document.querySelectorAll('img')]
			.map((img) => ({ img, r: img.getBoundingClientRect() }))
			.filter(
				(x) =>
					x.r.width > 40 &&
					x.r.width < 180 &&
					x.r.height > 40 &&
					x.r.height < 180
			);

		if (thumbs.length < 2) return false;

		thumbs.sort((a, b) => b.r.left - a.r.left || a.r.top - b.r.top);
		thumbs[1].img.click();
		return true;
	});

	if (clicked) await page.waitForTimeout(700);
	return clicked;
}

async function closeViewer(page) {
	await page.keyboard.press('Escape').catch(() => {});
	await page.waitForTimeout(600);
}

async function main() {
	const args = parseArgs(process.argv);
	const url = String(args.url || '');
	const ranges = String(args.ranges || '');
	const outDir = path.resolve(String(args.out || './out'));
	const mode = String(args.mode || 'raw').toLowerCase(); // 'raw' | 'graded'

	if (!url) throw new Error('Missing --url');
	if (!ranges) throw new Error('Missing --ranges');

	const wanted = expandRanges(ranges);
	await fs.promises.mkdir(outDir, { recursive: true });

	const browser = await chromium.launch({ headless: false });

	try {
		const context = await browser.newContext({
			storageState: 'psa-storage.json',
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
			viewport: { width: 1440, height: 900 },
			locale: 'en-US'
		});
		const page = await context.newPage();

		const modeLabel = mode === 'graded' ? 'Graded' : 'Raw';

		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
		await page.waitForTimeout(8000); // Cloudflare settle

		// Collect cert rows using two strategies:
		// 1. Text nodes "CERT ######" — in-progress orders
		// 2. <a href="/cert/######"> links — completed orders
		const rowsHandle = await page.evaluateHandle(() => {
			const out = [];
			const seen = new Set();

			function bubbleForImg(startEl, maxDepth) {
				let el = startEl;
				for (let i = 0; i < maxDepth && el; i++) {
					if (el.querySelector && el.querySelector('img')) return el;
					el = el.parentElement;
				}
				return null;
			}

			// Strategy 1: text nodes (in-progress orders)
			const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
			let node;
			while ((node = walker.nextNode())) {
				const m = (node.nodeValue || '').match(/\bCERT\s*#?\s*(\d{7,10})/i);
				if (!m) continue;
				const cert = m[1];
				if (seen.has(cert)) continue;
				seen.add(cert);
				const el = bubbleForImg(node.parentElement, 8);
				if (el) out.push({ cert, el });
			}

			// Strategy 2: cert href links (completed orders)
			document.querySelectorAll('a[href*="/cert/"]').forEach(a => {
				const m = a.href.match(/\/cert\/(\d{7,10})/);
				if (!m) return;
				const cert = m[1];
				if (seen.has(cert)) return;
				seen.add(cert);
				const el = bubbleForImg(a.parentElement, 15);
				if (el) out.push({ cert, el });
			});

			return out;
		});

		const props = await rowsHandle.getProperties();
		const targets = [];

		for (const [, h] of props) {
			const cert = await h.evaluate((x) => x.cert);
			const el = await h.evaluateHandle((x) => x.el);
			if (wanted.has(cert)) targets.push({ cert, el });
		}

		console.log(`Found ${targets.length} matching cert(s).`);

		for (const { cert, el } of targets) {
			console.log(`  Processing CERT ${cert} (${modeLabel})`);
			const certDir = path.join(outDir, cert, modeLabel);
			await fs.promises.mkdir(certDir, { recursive: true });

			try {
				await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
				await page.waitForTimeout(300);

				await el.evaluate((e) => {
					const img = e.querySelector('img');
					if (img) img.click();
				});
				await page.waitForTimeout(900);

				// Front
				const frontSrc = await waitForLargeImage(page);
				const frontBuf = await (await context.request.get(frontSrc)).body();
				await fs.promises.writeFile(path.join(certDir, `${cert}-1.jpg`), frontBuf);

				// Back (optional)
				if (await clickBackThumb(page)) {
					const backSrc = await waitForLargeImage(page);
					const backBuf = await (await context.request.get(backSrc)).body();
					await fs.promises.writeFile(path.join(certDir, `${cert}-2.jpg`), backBuf);
				}

				await closeViewer(page);
				console.log(`    ✓ Saved`);
			} catch (err) {
				console.warn(`    ⚠ Skipped — ${err.message}`);
				await closeViewer(page).catch(() => {});
			}
		}

		console.log('\nDone.');
	} finally {
		await browser.close();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
