<h1 align="center">Welcome to webmention-rss-discovery-sender 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/DR-DinoMight/webmention-rss-discovery-sender/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/DR-DinoMight/webmention-rss-discovery-sender/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/DR-DinoMight/webmention-rss-discovery-sender" />
  </a>
  <a href="https://twitter.com/DR\_DinoMight" target="_blank">
    <img alt="Twitter: DR_DinoMight" src="https://img.shields.io/twitter/follow/DR_DinoMight.svg?style=social" />
  </a>
</p>

> A simple webmention discovery and sender tool, that reads feed.xml and sends webmentions to the mentioned links of a post

## Install

```sh
npm install
```

Add options to the file or page that you want to process the webmentions for.
```js
  const options : WebmentionOptions = {
    postCount: Number(process.env.WEBMENTION_POST_COUNT) || 1, // Number of posts to process
    feedUrl: process.env.WEBMENTION_FEED_URL, // Eg. https://example.com/feed.xml
    logFileLocation: process.env.WEBMENTION_LOG_LOCATION, // Default: '/webmention-discovery.log'
    domainsToIgnoreString: process.env.WEBMENTION_IGNORED_DOMAINS, // Eg. 'example.com,example.org'
    // dryRun: true // Will not actually post webmentions but will do eveyrthing else including discovery and logging
  }
```

And call the function:
```js
  const webmentionData = await webmentionDiscovery(options);
```

## Run tests

```sh
npm run test
```

## Author

👤 **Matthew Peck-Deloughry <matt+npm@deloughry.co.uk> (https://deloughry.co.uk)**

* Website: https://deloughry.co.uk
* Twitter: [@DR\_DinoMight](https://twitter.com/DR\_DinoMight)
* Github: [@DR-DinoMight](https://github.com/DR-DinoMight)

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2022 [Matthew Peck-Deloughry <matt+npm@deloughry.co.uk> (https://deloughry.co.uk)](https://github.com/DR-DinoMight).<br />
This project is [MIT](https://github.com/DR-DinoMight/webmention-rss-discovery-sender/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
