const Apify = require('apify');
const { EnumURLTypes, EnumBaseUrl } = require('./constants');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

exports.log = log;

exports.splitUrl = (url) => url.split('?')[0];

exports.goToNextPage = async ({ requestQueue, page, request }) => {
    const doesNotHaveNextPage = await page.$eval('.pagination-next', (pagination) => {
        return Array.from(pagination.classList).includes('disabled');
    });

    if (doesNotHaveNextPage) {
        return;
    }

    const searchParams = new URLSearchParams(request.url);
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

    if (url.match(/upwork\.com\/(o\/profiles\/users.+|fl\/.+)/)) {
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

exports.gotoFunction = async ({ page, request }) => {
    await Apify.utils.puppeteer.blockRequests(page);
    return page.goto(request.url, { timeout: 60000 });
};
