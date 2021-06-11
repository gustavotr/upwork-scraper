const Apify = require('apify');
const { log } = require('../tools');

exports.profileParser = async ({ page, request, extendOutputFunction, itemCount, maxItems }) => {
    log.debug('Profile url...');

    const scrapedData = await Promise.allSettled([page.$eval('meta[data-n-head="ssr"][property="og:title"]', (el) => el.content),
        page.$eval('meta[data-n-head="ssr"][property="og:description"]', (el) => el.content),
        page.$eval('span[itemprop=locality]', (el) => el.innerText),
        page.$eval('span[itemprop="country-name"]', (el) => el.innerText),
        page.$eval('.cfe-ui-profile-job-success h3', (el) => el.innerText),
        page.$eval('.up-card-section h2', (el) => el.innerText),
        page.$$eval('h3[role=presentation', (elements) => elements[1].innerText),
        page.$$eval('.cfe-ui-profile-summary-stats .col-compact', (elements) => elements.map((el) => el.innerText)),
    ]);

    const [
        name,
        description,
        locality,
        country,
        jobSuccess,
        title,
        hourlyRate,
        stats,
    ] = scrapedData.map((promiseResult) => (promiseResult.status === 'fulfilled' ? promiseResult.value : null));

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
