const Apify = require('apify');
const { log, splitUrl } = require('../tools');

exports.profileSearchParser = async ({ requestQueue, page }) => {
    log.debug('Profile search url...');

    try {
        const usOnlySwitchSelector = '#cfe-domestic-switch-desktop.up-switch-on';
        await page.waitForSelector(usOnlySwitchSelector, { timeout: 500 });
        await page.click(usOnlySwitchSelector);
        log.debug('Turned off US-only');
    } catch (err) {
        log.debug('No US-only switch found');
    }

    try {
        log.debug('Looking for profiles...');
        await page.waitForSelector('div.freelancer-tile', { timeout: 5000 });
        const tiles = await page.$$('div.freelancer-tile');
        log.debug(`${tiles.length} profiles found in this page`);
        const profiles = [];
        await tiles.reduce(async (next, current) => {
            await next;

            await current.$eval('img.up-avatar', (el) => {
                el.click();
            });
            const linkElement = await page.$('a[href^="/freelancers"]');
            const url = await page.evaluate((el) => {
                return el.href;
            }, linkElement);
            profiles.push(url);
        }, Promise.resolve());

        for (const profileUrl of profiles) {
            const url = splitUrl(profileUrl);
            await requestQueue.addRequest({ url });
        }
    } catch (err) {
        log.debug(err);
        Apify.events.emit('error');
        log.error('No profiles were found');
    }
};
