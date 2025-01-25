const core = require('@actions/core');
const { By, Browser, Builder } = require("selenium-webdriver");
const fs = require('fs');
const path = require('path');

let secret;
let attempts = 0, maxAttempts = 3;

// get credentials
async function getCredential(type) {
	let res;
	while (attempts < maxAttempts) {
		await driver.manage().setTimeouts({implicit: 2000 * attempts});
		try {
			let credentials = await driver.findElements(By.className('credential'));
			res = await credentials[type].getText();
			break;
		} catch (e) {
			if (attempts == maxAttempts) {
				throw error('[ERROR] credentials error retry limit reached (' + attempts + ')');
			}
			console.error('[ERROR] credentials error... retry (' + attempts++ + ')');
		}
	}
	return res;
}

// write secret to file
async function makeSecretFile() {
	const dir = './';
	const fileName = '.secret42.txt';
	const filePath = path.join(dir, fileName);

	fs.writeFileSync(filePath, secret, (e) => {
		if (e)
			throw error('[ERROR] failed to write secret to file');
		else
			console.log('successfully writed ' + filePath);
	});
}

// run jobs
async function run() {
	try {
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
		
		// id, pw input and login
		await driver.findElement(By.id('username')).sendKeys(process.env.INTRA_ID);
		await driver.findElement(By.id('password')).sendKeys(process.env.INTRA_PW);
		await driver.findElement(By.id('kc-login')).click();
		await driver.manage().setTimeouts({implicit: 1000});
		
		// go to profile->settings->api
		await driver.get(process.env.APP_URL);
		await driver.manage().setTimeouts({implicit: 1000});
		
		// if 'Replace now' btn exists, click it and copy 'secret'
		// if 'Generate now' btn exists, click it and copy 'next secret'
		let buttons = await driver.findElements(By.className('pull-right btn btn-danger small'));
		for (let b of buttons) {
			let innerHTML = await b.getText();
			if (innerHTML === 'Replace now') {
				await b.click();
				console.log('[CLICKED] replace now btn');
				secret = await getCredential(1);
				break;
			}
			if (innerHTML === 'Generate now') {
				console.log('[CLICKED] generate now btn');
				await b.click();
				secret = await getCredential(2);
				break;
			}
		}
		await driver.manage().setTimeouts({implicit: 1000});
		
		// if 'Replace now' btn exists, click it to replace new secret
		buttons = await driver.findElements(By.className('pull-right btn btn-danger small'));
		for (let b of buttons) {
			let innerHTML = await b.getText();
			if (innerHTML === 'Replace now') {
				await b.click();
				console.log('[CLICKED] replace now btn');
				break;
			}
		}
		await driver.manage().setTimeouts({implicit: 1000});

		// write to file '$PATH/.secret42.txt'
		makeSecretFile();
	} catch (e) {
		throw error('[ERROR] crawling error: ' + e);
	} finally {
		await driver.manage().setTimeouts({implicit: 3000});
		await driver.quit();
	}
}

try {
	run();
} catch (e) {
	core.setFailed(e.message);
}