### Upwork Scraper

Upwork Scraper is an [Apify actor](https://apify.com/actors) for extracting data from [Upwork](https://www.upwork.com/). It allows you to extract info from freelancers and agencies without login. It is build on top of [Apify SDK](https://sdk.apify.com/) and you can run it both on [Apify platform](https://my.apify.com) and locally.

- [Input](#input)
- [Output](#output)
- [Compute units consumption](#compute-units-consumption)
- [Extend output function](#extend-output-function)

### Input

| Field | Type | Description | Default value
| ----- | ---- | ----------- | -------------|
| startUrls | array | List of [Request](https://sdk.apify.com/docs/api/request#docsNav) objects that will be deeply crawled.  |  |
| useBuiltInSearch | boolean | When set to true (checked), the startUrls will be ignored and the actor will perform a search based on the fields bellow. | false |
| search | string | Keyword that will be used in the Upwork's search engine. |  |
| category | string | You can provide a category_uid to filter your search. |  |
| englishLevel | string | You can can pass one of the options bellow as a filter to the desired english level. `"0" -> Any level; "1" -> Basic; "2" -> Conversational; "3" -> FLuent; "4" -> Native or bilingual`| "0" |
| hourlyRate | string | You can can pass one of the options bellow as a filter to the desired hourly rate. `"" -> Any; "0-10" ->  between $0 and $10; "10-30" ->  between $10 and $30; "30-60" ->  between $30 and $60; "60" -> above $60`| "" |
| maxItems | number | How many search results should be saved. | 100 |
| extendOutputFunction | string | A Javascript function passed as plain text that can return custom information. More on [Extend output function](#extend-output-function). | |
| proxy | object | Proxy configuration of the run. | `{"useApifyProxy": true }`|

#### Suported startUrls

- www.upwork.com/hire/*
- www.upwork.com/search/profiles/*
- www.upwork.com/search/o/profiles/users/*
- www.upwork.com/search/fl/*


### Output

Output is stored in a dataset. 


```json
{
  "name": "Jon Doe",
  "location": {
    "country": "United States",
    "city": "Goldfield",
    "state": "IA",
    "countryTimezone": "America/Chicago",
    "worldRegion": "Goldfield, United States (America/C)",
    "timezoneOffset": -18000,
    "countryCodeIso2": "US",
    "countryCodeIso3": "USA",
    "countryCode": "USA"
  },
  "title": "Fast, Friendly, Reliable!",
  "description": "I believe highly in perfection in my work.  I have written short articles, reviews, as well as blog posts for different companies using WordPress and have done website testing as well. I am a gifted technical writer and article spinner.  I have also been a ghostwriter for multiple clients on a variety of both fiction and non-fiction writing.  I also do data entry on a daily basis into Excel books and am responsible for payroll at my full time job.  I have excellent communication skills and work as an administrative assistant on a full time basis.  I understand the need for quality work and communication to get the job done right!",
  "jobSuccess": 0,
  "hourlyRate": {
    "currencyCode": "USD",
    "amount": 5
  },
  "earned": 477.48,
  "numberOfJobs": 10,
  "hoursWorked": 0.5,
  "profileUrl": "https://www.upwork.com/o/profiles/users/~XXXXX/",
}
```

### Compute units consumption

Estimated ~0.95 CU per 100 requests

### Extend output function

You can use this function to update the result output of this actor. You can choose what data from the page you want to scrape. The output from this will function will get merged with the result output.

The return value of this function has to be an object!

You can return fields to achive 3 different things:
- Add a new field - Return object with a field that is not in the result output
- Change a field - Return an existing field with a new value
- Remove a field - Return an existing field with a value `undefined`


```js
async () => {
  return {
        pageTitle: document.querySelecto('title').innerText,
    }
}
```

This example will add the title of the page to the final object:

```json
{
  "name": "John Doe",
  "location": {
    "country": "United States",
    "city": "Goldfield",
    "state": "IA",
    "countryTimezone": "America/Chicago",
    "worldRegion": "Goldfield, United States (America/C)",
    "timezoneOffset": -18000,
    "countryCodeIso2": "US",
    "countryCodeIso3": "USA",
    "countryCode": "USA"
  },
  "title": "Fast, Friendly, Reliable!",
  "description": "I believe highly in perfection in my work.  I have written short articles, reviews, as well as blog posts for different companies using WordPress and have done website testing as well. I am a gifted technical writer and article spinner.  I have also been a ghostwriter for multiple clients on a variety of both fiction and non-fiction writing.  I also do data entry on a daily basis into Excel books and am responsible for payroll at my full time job.  I have excellent communication skills and work as an administrative assistant on a full time basis.  I understand the need for quality work and communication to get the job done right!",
  "jobSuccess": 0,
  "hourlyRate": {
    "currencyCode": "USD",
    "amount": 5
  },
  "earned": 477.48,
  "numberOfJobs": 10,
  "hoursWorked": 0.5,
  "profileUrl": "https://www.upwork.com/o/profiles/users/~XXXXX/",
  "pageTitle": "John Doe - Fast, Friendly, Reliable! - Upwork"
}
```

Upwork stores the full data of the frelancer in a javascript variable. You can access that variable to get more information from the freelancer profile. The code bellow adds the full profile variable to the output. You can use the extended output function to extract only the data that you need.

```js
async () => {
    return { profileResponse: window.PROFILE_RESPONSE }
}
```
