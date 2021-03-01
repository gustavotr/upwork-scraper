const Apify = require('apify');
const { EnumURLTypes, EnumBaseUrl } = require('./constants');

const { log } = Apify.utils;

exports.log = log;

exports.enableDebugMode = () => {
    log.setLevel(log.LEVELS.DEBUG);
};

exports.splitUrl = (url) => url.split('?')[0];

exports.goToNextPage = async ({ requestQueue, page }) => {
    log.debug('Looking for pagination');
    const doesNotHaveNextPage = await page.$eval('.up-pagination-item', (pagination) => {
        return Array.from(pagination.classList).includes('disabled');
    });

    if (doesNotHaveNextPage) {
        return;
    }

    const searchParams = new URLSearchParams(page.url());
    const pageNumber = Number(searchParams.get('page')) || 1;

    searchParams.set('page', pageNumber + 1);

    await requestQueue.addRequest({ url: unescape(searchParams.toString()) });
    log.info('Pagination found, new page added to queue.');
};

exports.getUrlType = (url = '') => {
    let type = null;

    if (url.match(/upwork\.com\/*$/)) {
        type = EnumURLTypes.START_URL;
    }

    if (url.match(/upwork\.com\/hire.+/)) {
        type = EnumURLTypes.CATEGORY;
    }

    if (url.match(/upwork\.com\/search\/profiles.+/)) {
        type = EnumURLTypes.PROFILE_SEARCH;
    }

    if (url.match(/upwork\.com\/search\/jobs.+/)) {
        type = EnumURLTypes.JOB_SEARCH;
    }

    if (url.match(/upwork\.com\/(o\/profiles\/users|fl|freelancers)\/.+/)) {
        type = EnumURLTypes.PROFILE;
    }

    return type;
};

exports.getSearchUrl = ({ search, category, hourlyRate, englishLevel }) => {
    const url = new URL(EnumBaseUrl.PROFILE_SEARCH_URL);

    if (search) {
        url.searchParams.append('q', search);
    }

    if (hourlyRate) {
        url.searchParams.append('rate', hourlyRate);
    }

    if (category) {
        url.searchParams.append('category_uid', category);
    }

    if (englishLevel) {
        url.searchParams.append('english', englishLevel);
    }

    return url.href;
};

exports.blockUnusedRequests = async (page) => {
    await Apify.utils.puppeteer.blockRequests(page, {
        urlPatterns: [
            '.jpg',
            '.jpeg',
            '.png',
            '.svg',
            '.gif',
            '.woff',
            '.pdf',
            '.zip',
            'doubleclicks',
        ],
    });
};
