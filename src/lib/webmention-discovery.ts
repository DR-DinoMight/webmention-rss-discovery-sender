import {FeedLog, ReferenceLink, WebmentionOptions} from './types';
import {XMLParser} from "fast-xml-parser";
import {fetchLogEntry, referenceLinkExists, upsertLogEntry} from "./logging";

const fetchArticlesToCheck = async ({ postCount, feedUrl, logFileLocation }: WebmentionOptions) => {
  try {
    const res = await fetch(feedUrl);
    const feed = await res.text();
    const parser = new XMLParser();
    const feedJson = parser.parse(feed);

    let items = feedJson.rss.channel.item;
    if (items) {
      items = Array.from(items).sort((a: any, b: any) => {
        const aDate = new Date(a.pubDate);
        const bDate = new Date(b.pubDate);
        return bDate.getTime() - aDate.getTime();
      }).slice(0, postCount);
    }
    return items.filter(async (item: { link: string; }) => {
      if (item.link) {
        const logEntry = await fetchLogEntry(logFileLocation, item.link)
        return !(logEntry);
      }

      return false;
    }).map((item: any) => item.link);
  } catch (e) {
    // @ts-ignore
    throw new Error(e);
  }
}

const cleanLink = (link: string) => {
  let cleanedLink = link.replace('http://', 'https://');
  // remove any anchor links or query string (e.g. #comments or ?comment-page=2 etc)
  cleanedLink = cleanedLink.split('#')[0].split('?')[0];
  // remove trailing slash
  return cleanedLink.replace(/\/$/, '').toLocaleLowerCase();
}

const processLinks = async (links: string[], postLink: string, options: WebmentionOptions) : Promise<string[] | undefined> => {
  if (!links || links.length === 0) {
    return [];
  }
  let processedLinks = links.map(link => cleanLink(link)).filter((link) => {
    // return false if relative link
    if (link.startsWith('/')) {
      return false;
    }

    try {
      const url = new URL(link);
      const domain = url.hostname;
      const inDomainsToIgnore = options.domainsToIgnore?.includes(domain.toLocaleLowerCase().replace('www.',''));
      return !inDomainsToIgnore;

    } catch (e) {
      return false;
    }
  });

  // remove duplicates
  processedLinks = processedLinks.filter((link, index, self) => {
    return self.indexOf(link) === index;
  });

  // check if link exists in log
  processedLinks = await Promise.all(processedLinks.filter(async link => {
    return  ! await referenceLinkExists(options.logFileLocation, postLink, link);
  }));

  return processedLinks;
}

const resolveReferenceLinksForPost = async (postLink: string, options: WebmentionOptions) : Promise<ReferenceLink[] | undefined> => {
  try {
    const res = await fetch(postLink);

    if (!res.ok) {
      throw new Error(`Could not fetch ${postLink}, status ${res.status}`);
    }

    const htmlContent = await res.text();
    let aLinks = htmlContent
      ?.match(/<a[^>]*href="([^"]*)"[^>]*>/g)
      ?.map(link => {
        let result = link.match(/<a[^>]*href="([^"]*)"[^>]*>/);
        if (result && result.length > 1) {
          return result[1];
        }
      });

    if (!aLinks || aLinks.length <= 0) {
      return;
    }

    // @ts-ignore
    const links = await processLinks(aLinks, postLink, options);
    //create a ReferenceLink for each link
    if (!links) {
      return;
    }

    return links.map(link => {
      return {
        url: link,
        status: 'pending',
        dateAttempted: new Date()
      }
    });
  } catch (e : any) {
    throw new Error(e.message);
  }
}

const resolveFeedLogForPosts = async (postLinks: string[], options: WebmentionOptions): Promise<FeedLog[]> => {
  let results : FeedLog[] = [];

  for (const postLink of postLinks) {
    const feedLog = {
      srcLink: postLink,
      referencedLinks: [],
      dateAttempted: new Date(),
    }
    // @ts-ignore
    feedLog.referencedLinks = await resolveReferenceLinksForPost(postLink, options);
    results.push(feedLog);
  }
  return results;
}

// Query the url and check if it has a webmention endpoint
const discoverWebmentionEndpoint = async (referenceLink: ReferenceLink) : Promise<ReferenceLink | undefined> => {
  try {
    const res = await fetch(referenceLink.url);
    let webmentionLink : string | null = null;
    if (res.ok) {
      const headers = res.headers.get("Link");
      if (headers) {
        const headerLink = headers.match(/<(.*)>; rel="webmention"/);
        if (headerLink) {
          webmentionLink = headerLink[1];
        }
      }
      else {
        //can't find webmention link, try to find it in the html
        const html = await res.text();
        //fetch the 1st link tags that have rel="webmention"
        const webmentionTag= html.match(/<link[^>]*rel="webmention"[^>]*>/);
        //get the href attribute
        if (webmentionTag) {
          const hrefTag = webmentionTag[0].match(/href="([^"]*)"/);
          if (hrefTag) {
            webmentionLink = hrefTag[1];
          }
        }
      }
      if (webmentionLink) {
        referenceLink.webmentionLink = webmentionLink;
      }
      else {
        referenceLink.status = 'no webmention endpoint found';
        referenceLink.dateProcessed = new Date();
      }
    }
    else {
      referenceLink.status = res.statusText;
      referenceLink.dateProcessed = new Date();
    }
  } catch (e) {
    referenceLink.status = 'ERROR';
    referenceLink.dateProcessed = new Date();
  }
  return referenceLink;
}

const postLink = async (referenceLink: ReferenceLink, postLink: string, options?: WebmentionOptions) : Promise<ReferenceLink> => {
  try {
    if (options && options.dryRun) {
      referenceLink.status = 'dry run';
      referenceLink.dateProcessed = new Date();
      return referenceLink;
    }
    else {
      const res = await fetch(referenceLink.webmentionLink!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: "source=" + postLink + "&target=" + referenceLink.url
      });

      if (res.ok) {
        referenceLink.status = 'success';
        referenceLink.dateProcessed = new Date();
      } else {
        referenceLink.status = res.statusText;
        referenceLink.dateProcessed = new Date();
      }
    }
  } catch (e: any) {
    referenceLink.status = e.message;
    referenceLink.dateProcessed = new Date();
  }
  return referenceLink;
}

export default async (options: WebmentionOptions) : Promise<boolean> => {
  if (!options.feedUrl) throw new Error('No feed url provided');
  if (!options.logFileLocation) options.logFileLocation = '/webmention-discovery.log';
  if (!options.postCount) options.postCount = 1;
  if (options.domainsToIgnoreString.length > 0) {
    options.domainsToIgnore = options.domainsToIgnoreString.split(',');
  }

  const articlesToCheck = await fetchArticlesToCheck(options);

  if (articlesToCheck.length === 0) {
    console.log('No new articles to check');
    return false;
  }
  const feedLogs = await resolveFeedLogForPosts(articlesToCheck, options);
  for (let feedLog of feedLogs) {
    for (let referenceLink of feedLog.referencedLinks) {
      let discoveredReferenceLink = await discoverWebmentionEndpoint(referenceLink);
      if (discoveredReferenceLink && discoveredReferenceLink.status === 'pending') {
        if (discoveredReferenceLink.webmentionLink && !discoveredReferenceLink.dateProcessed) {
          discoveredReferenceLink = await postLink(discoveredReferenceLink, feedLog.srcLink, options);
        }

        //replace the discoveredReferenceLink in the feedLog
        feedLog.referencedLinks = feedLog.referencedLinks.map(rl => {
          if (rl.url === discoveredReferenceLink?.url) {
            return discoveredReferenceLink;
          }
          return rl;
        });
      }
    }

    feedLog.dateAttempted = new Date();

    await upsertLogEntry(options.logFileLocation, feedLog);
    console.log(`${feedLog.srcLink} all processed`);
    console.log('----------------------------------------');
  }
  console.log(`${articlesToCheck.length} articles processed`);
  return true;
}
