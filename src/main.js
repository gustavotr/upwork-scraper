const Apify = require('apify');
const { log, getUrlType, goToNextPage, getSearchUrl, blockUnusedRequests, enableDebugMode } = require('./tools');
const { EnumURLTypes } = require('./constants');
const { profileParser, categoryParser, profileSearchParser } = require('./parsers');

Apify.main(async () => {
    const input = await Apify.getInput();

    const { proxy, startUrls, maxItems, search, extendOutputFunction, category, hourlyRate, englishLevel, useBuiltInSearch, debugMode } = input;

    if (debugMode) {
        enableDebugMode();
    }

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

    const proxyConfiguration = await Apify.createProxyConfiguration(proxy);

    const preNavigationHooks = [
        async (crawlingContext) => {
            await blockUnusedRequests(crawlingContext.page);
        },
    ];

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        useSessionPool: true,
        persistCookiesPerSession: true,
        proxyConfiguration,
        launchContext: {
            useChrome: true,
            launchOptions: {
                headless: false,
                stealth: false,
                devtools: !Apify.isAtHome(),
                stealthOptions: {
                    addPlugins: false,
                    emulateWindowFrame: false,
                    emulateWebGL: false,
                    emulateConsoleDebug: false,
                    addLanguage: false,
                    hideWebDriver: true,
                    hackPermissions: false,
                    mockChrome: false,
                    mockChromeInIframe: false,
                    mockDeviceMemory: false,
                },
                args: [
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--disable-notifications',
                ],
                useChrome: Apify.isAtHome(),
            },
        },

        preNavigationHooks,

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
                throw new Error(`Human verification required on ${request.url}`);
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

        handleFailedRequestFunction: async ({ request }) => {
            log.error(`Request failed too many times: ${request.url}`);
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
