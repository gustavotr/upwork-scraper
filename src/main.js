const Apify = require('apify');
const { log, getUrlType, goToNextPage, getSearchUrl, gotoFunction } = require('./tools');
const { EnumURLTypes } = require('./constants');
const { profileParser, categoryParser, profileSearchParser } = require('./parsers');

Apify.main(async () => {
    const input = await Apify.getInput();

    const { proxy, startUrls, maxItems, search, extendOutputFunction, category, hourlyRate, englishLevel, useBuiltInSearch } = input;

    if (!startUrls && !useBuiltInSearch) {
        throw new Error('startUrls or built-in search must be used!');
    }

    const requestList = await Apify.openRequestList('start-urls', useBuiltInSearch ? [] : startUrls.map((url) => ({ url })));
    const requestQueue = await Apify.openRequestQueue();

    if (useBuiltInSearch) {
        await requestQueue.addRequest({ url: getSearchUrl({ search, category, hourlyRate, englishLevel }) });
    }

    const dataset = await Apify.openDataset();
    let { itemCount } = await dataset.getInfo();

    let proxyConfiguration = null;

    if (proxy.useApifyProxy) {
        proxyConfiguration = await Apify.createProxyConfiguration({
            groups: proxy.apifyProxyGroups,
        });
    }

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        useSessionPool: true,
        persistCookiesPerSession: true,
        proxyConfiguration,
        launchPuppeteerOptions: {
            stealth: true,
            devtools: !Apify.isAtHome(),
        },

        gotoFunction,

        handlePageFunction: async (context) => {
            if (itemCount >= maxItems) {
                log.info('Actor reached the max items limit. Crawler is going to halt...');
                log.info('Crawler Finished.');
                process.exit();
            }

            const { page, request, session } = context;
            log.info(`Processing ${request.url}...`);

            const title = await page.title();

            if (title.includes('denied')) {
                session.retire();
                throw new Error(`Human verifition required on ${request.url}`);
            }

            const type = getUrlType(request.url);

            switch (type) {
                case EnumURLTypes.CATEGORY:
                    return categoryParser({ requestQueue, ...context });
                case EnumURLTypes.PROFILE_SEARCH:
                    await profileSearchParser({ requestQueue, ...context });
                    return goToNextPage({ requestQueue, ...context });
                case EnumURLTypes.PROFILE:
                    await profileParser({ requestQueue, ...context, extendOutputFunction, itemCount, maxItems });
                    itemCount++;
                    return;
                default:
                    log.warning(`Url does not match any parser: ${request.url}`);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
