import { chromium } from 'patchright';

async function main() {
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		viewport: { width: 1440, height: 900 },
		locale: 'en-US'
	});
	const page = await context.newPage();

	// Go somewhere that requires auth so you're forced into the login flow
	await page.goto('https://www.psacard.com/myaccount', {
		waitUntil: 'domcontentloaded'
	});

	console.log(
		"\nLog in normally (including MFA). When you're fully logged in, press Enter here.\n"
	);
	await new Promise((resolve) => process.stdin.once('data', resolve));

	await context.storageState({ path: 'psa-storage.json' });
	console.log(
		'Saved session to psa-storage.json. Wait for script to begin scraping workflow.'
	);

	await browser.close();
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
