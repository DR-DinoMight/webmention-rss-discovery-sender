export type WebmentionOptions = {
  postCount: number;
  feedUrl: string;
  logFileLocation: string;
  domainsToIgnoreString: string;
  domainsToIgnore?: string[];
  dryRun?: boolean;
}

export type FeedLog = {
  srcLink: string;
  referencedLinks: ReferenceLink[];
  dateAttempted: Date;
}
export type ReferenceLink = {
  url: string
  webmentionLink?: string,
  status: string,
  dateProcessed?: Date,
  dateAttempted: Date,
}
