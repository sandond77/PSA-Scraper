import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';

function run(cmd, args) {
	const r = spawnSync(cmd, args, { stdio: 'inherit' });
	if (r.status !== 0) process.exit(r.status ?? 1);
}

async function prompt(question, defaultVal) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	const q = defaultVal ? `${question} [${defaultVal}]: ` : `${question}: `;
	const answer = await new Promise((resolve) => rl.question(q, resolve));
	rl.close();
	const v = String(answer || '').trim();
	return v.length ? v : defaultVal ?? '';
}

async function main() {
	console.log('\n=== PSA Card Image Scraper ===\n');

	// Prompt for URL
	let url = '';
	while (!url.startsWith('https://www.psacard.com/')) {
		url = await prompt(
			'PSA order URL\n  (e.g. https://www.psacard.com/myaccount/myorders/13490465/25504619)'
		);
		if (!url.startsWith('https://www.psacard.com/')) {
			console.log('  ✗ Must be a psacard.com URL. Try again.\n');
		}
	}

	// Prompt for cert ranges
	let ranges = '';
	while (!ranges) {
		ranges = await prompt(
			'\nCert range(s)\n  (e.g. 127283889-127284082, or multiple: 127283889-127283900,127284000-127284010)'
		);
		if (!ranges) console.log('  ✗ Required. Try again.\n');
	}

	// Batch name → always a subfolder of Desktop/PSA Scrapes
	const baseFolder = path.join(os.homedir(), 'Desktop', 'PSA Scrapes');
	const batchName = await prompt(
		'\nBatch name for this download?\n  Tip: use "Year Month Tier" format, e.g. 2026 January Value Plus\n  (creates a subfolder on your Desktop under "PSA Scrapes")',
		'My Batch'
	);
	const outDir = path.resolve(path.join(baseFolder, batchName));
	fs.mkdirSync(outDir, { recursive: true });

	// Login (only if session missing)
	const storageFile = path.resolve('psa-storage.json');
	if (!fs.existsSync(storageFile)) {
		console.log('\nNo saved session found — launching login flow...\n');
		run('node', ['psa-login.mjs']);
	} else {
		console.log('\nFound saved session → skipping login.');
	}

	console.log('\nStarting scrape...\n');

	run('node', [
		'scrape-psa-firstview-hires.mjs',
		'--url', url,
		'--ranges', ranges,
		'--out', outDir
	]);

	console.log(`\nDone. Files saved to: ${outDir}\n`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
