const core = require('@actions/core');
const { By, Browser, Builder } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

let driver;
let secret;
let attempts = 0, maxAttempts = 3;

// get credentials
async function getCredential(type) {
	let res;
	while (attempts < maxAttempts) {
		await driver.manage().setTimeouts({ implicit: 2000 * (attempts + 1) });
		try {
			let credentials = await driver.findElements(By.className('credential'));
			if (!credentials[type]) throw new Error('Credential index not found');
			res = await credentials[type].getText();
			if (!res) throw new Error('Empty credential text');
			break;
		} catch (e) {
			attempts++;
			console.error(`[ERROR] getCredential failed (attempt ${attempts}/${maxAttempts}): ${e.message}`);
			if (attempts >= maxAttempts) {
				throw new Error('[ERROR] credentials error retry limit reached (' + attempts + ')');
			}
		}
	}
	return res;
}


// write secret to file
function makeSecretFile() {
	const dir = './';
	const fileName = '.secret42.txt';
	const filePath = path.join(dir, fileName);

	fs.writeFileSync(filePath, secret, (e) => {
		throw new Error('[ERROR] failed to write secret to file');
	});
	console.log('[Crawling...] successfully writed ' + filePath);
}

// validate environment variables
function validateEnv() {
	if (!process.env.INTRA_ID || !process.env.INTRA_PW || !process.env.APP_URL) {
		throw new Error('[ERROR] environment variables are invalid or not set. Please check your environment variables');
	}
}

// run jobs
(async function run() {
	try {
		validateEnv();

		// Set up Chrome options for headless mode
		let options = new chrome.Options();
		options.addArguments('headless');
		options.addArguments('disable-gpu');

		// Set up Chrome driver
		driver = await new Builder()
			.forBrowser(Browser.CHROME)
			.setChromeOptions(options)
			.build();
	
		// go to 42intra
		await driver.get('https://profile.intra.42.fr');
		await driver.manage().setTimeouts({implicit: 500});
		console.log('[Crawling...] enterd 42intra');
		
		// id, pw input and login
		await driver.findElement(By.id('username')).sendKeys(process.env.INTRA_ID);
		await driver.findElement(By.id('password')).sendKeys(process.env.INTRA_PW);
		await driver.findElement(By.id('kc-login')).click();
		await driver.manage().setTimeouts({implicit: 1000});
		console.log('[Crawling...] login success');
		
		// go to profile->settings->api
		await driver.get(process.env.APP_URL);
		await driver.manage().setTimeouts({implicit: 1000});
		console.log('[Crawling...] enterd app url');
		
		// if 'Replace now' btn exists, click it and copy 'secret'
		// if 'Generate now' btn exists, click it and copy 'next secret'
		let buttons = await driver.findElements(By.className('pull-right btn btn-danger small'));
		for (let b of buttons) {
			let innerHTML = await b.getText();
			if (innerHTML === 'Replace now') {
				await b.click();
				console.log('[Crawling...] clicked replace now btn');
				secret = await getCredential(1);
				break;
			}
			if (innerHTML === 'Generate now') {
				console.log('[Crawling...] clicked generate now btn');
				await b.click();
				secret = await getCredential(2);
				break;
			}
		}
		await driver.manage().setTimeouts({implicit: 1000});

		if (!secret) {
			throw new Error('[ERROR] secret is undefined. getCredential() failed.');
		}
		
		// if 'Replace now' btn exists, click it to replace new secret
		buttons = await driver.findElements(By.className('pull-right btn btn-danger small'));
		for (let b of buttons) {
			let innerHTML = await b.getText();
			if (innerHTML === 'Replace now') {
				await b.click();
				console.log('[Crawling...] clicked replace now btn');
				break;
			}
		}
		await driver.manage().setTimeouts({implicit: 1000});

		// write to file '$PATH/.secret42.txt'
		makeSecretFile();
	} catch (e) {
		core.setFailed(e);
	} finally {
		await driver.manage().setTimeouts({implicit: 3000});
		await driver.quit();
		console.log('[Crawling...] successfully quited selenium driver');
	}
}());
