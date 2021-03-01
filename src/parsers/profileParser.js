const Apify = require('apify');
const { log } = require('../tools');

exports.profileParser = async ({ page, request, extendOutputFunction, itemCount, maxItems }) => {
    log.debug('Profile url...');

    const name = await page.$eval('meta[data-n-head="ssr"][property="og:title"]', (el) => el.content);
    const description = await page.$eval('meta[data-n-head="ssr"][property="og:description"]', (el) => el.content);
    const locality = await page.$eval('span[itemprop=locality]', (el) => el.innerText);
    const country = await page.$eval('span[itemprop="country-name"]', (el) => el.innerText);
    const jobSuccess = await page.$eval('.cfe-ui-profile-job-success h3', (el) => el.innerText);
    const title = await page.$eval('.up-card-section h2', (el) => el.innerText);
    const hourlyRate = await page.$$eval('h3[role=presentation', (elements) => elements[1].innerText);
    const stats = await page.$$eval('.cfe-ui-profile-summary-stats .col-compact', (elements) => elements.map((el) => el.innerText));

    const freelancer = {
        name,
        location: `${locality} - ${country}`,
        title,
        description,
        jobSuccess,
        hourlyRate,
        // earned: stats.totalRevenue,
        // numberOfJobs: stats.totalJobsWorked,
        // hoursWorked: stats.totalHours,
        stats,
        profileUrl: request.url,
    };

    let userResult = {};
    if (extendOutputFunction) {
        userResult = await page.evaluate((functionStr) => {
            // eslint-disable-next-line no-eval
            const f = eval(functionStr);
            return f();
        }, extendOutputFunction);
    }

    Object.assign(freelancer, userResult);

    if (itemCount < maxItems) {
        await Apify.pushData(freelancer);
    }
};
