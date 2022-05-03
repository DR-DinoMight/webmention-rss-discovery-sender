import webmentionDiscovery from './lib/webmention-discovery';
import {WebmentionOptions, FeedLog, ReferenceLink} from "./lib/types";
import {fetchLogEntry, referenceLinkExists, upsertLogEntry} from "./lib/logging";

export {
  webmentionDiscovery,
  fetchLogEntry,
  referenceLinkExists,
  upsertLogEntry
};

export type {
  WebmentionOptions,
  FeedLog,
  ReferenceLink
};
