import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { spawnSync, execSync } from 'node:child_process';

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

function pickFolderMac(defaultPath) {
	try {
		const escaped = defaultPath.replace(/'/g, "\\'");
		const result = execSync(
			`osascript -e 'POSIX path of (choose folder with prompt "Select a folder to save images into:" default location (POSIX file "${escaped}"))'`,
			{ stdio: ['pipe', 'pipe', 'pipe'] }
		).toString().trim();
		return result || null;
	} catch {
		return null; // user cancelled
	}
}

function pickFolderWindows(defaultPath) {
	try {
		const escaped = defaultPath.replace(/\\/g, '\\\\');
		const result = execSync(
			`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select a folder to save images into'; $d.SelectedPath = '${escaped}'; $d.ShowNewFolderButton = $true; if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }"`,
			{ stdio: ['pipe', 'pipe', 'pipe'] }
		).toString().trim();
		return result || null;
	} catch {
		return null; // user cancelled
	}
}

async function pickOutDir() {
	const baseFolder = path.join(os.homedir(), 'Desktop', 'PSA Scrapes');

	console.log('\nOpening folder picker — choose or create a folder for this batch...');

	let picked = null;
	if (process.platform === 'darwin') {
		picked = pickFolderMac(baseFolder);
	} else if (process.platform === 'win32') {
		picked = pickFolderWindows(baseFolder);
	}

	if (picked) {
		console.log(`  Saving to: ${picked}`);
		return picked;
	}

	// Fallback: text prompt (picker cancelled or unsupported OS)
	console.log('  (No folder selected — falling back to text input)');
	const batchName = await prompt(
		'\nBatch name for this download?\n  Tip: use "Year Month Tier" format, e.g. 2026 January Value Plus\n  (creates a subfolder on your Desktop under "PSA Scrapes")',
		'My Batch'
	);
	return path.join(baseFolder, batchName);
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

	// Prompt for mode
	let mode = '';
	while (mode !== 'raw' && mode !== 'graded') {
		mode = (await prompt('\nCard type — Raw or Graded?', 'Raw')).toLowerCase();
		if (mode !== 'raw' && mode !== 'graded') {
			console.log('  ✗ Enter Raw or Graded. Try again.\n');
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

	// Folder picker
	const outDir = path.resolve(await pickOutDir());
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
		'--out', outDir,
		'--mode', mode
	]);

	console.log(`\nDone. Files saved to: ${outDir}\n`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
