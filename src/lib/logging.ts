import * as fs from "fs";
import {FeedLog} from "./types";

const createLogFileIfNotExists = (logFileLocation: string) : void => {
  if (!fs.existsSync(logFileLocation)) {
    fs.writeFileSync(logFileLocation, JSON.stringify([]));
  }
}

const fetchLogFile = (logFileLocation : string, createIfNotExists: boolean = true) : Promise<FeedLog[]> => {
  if (createIfNotExists) {
    createLogFileIfNotExists(logFileLocation);
  }

  return JSON.parse(fs.readFileSync(logFileLocation).toString());
}

export const fetchLogEntry = async (logFileLocation: string, srcLink: string): Promise<FeedLog | undefined>  => {
  const log = await fetchLogFile(logFileLocation);

  if (!log) return;
  const logEntry : FeedLog | undefined = log.find(entry => entry.srcLink === srcLink);
  if (!logEntry) return;
  return logEntry;
}

export const referenceLinkExists = async (logFileLocation: string, logEntrySrcLink: string, referenceLink: string) : Promise<boolean> => {
  const logEntry = await fetchLogEntry(logFileLocation, logEntrySrcLink);

  if (!logEntry) return false;
  return logEntry.referencedLinks.some(link => link.url === referenceLink);
}

export const upsertLogEntry = async (logFileLocation: string, feedLogEntry: FeedLog) => {
  const log = await fetchLogFile(logFileLocation);
  const logEntry : FeedLog | undefined = log.find(entry => entry.srcLink === feedLogEntry.srcLink);

  // If the log entry exists, update it

  if (logEntry) {
    log.splice(log.indexOf(logEntry), 1, feedLogEntry);
  } else {
    log.push(feedLogEntry);
  }
  if (log) fs.writeFileSync(logFileLocation, JSON.stringify(log, null, 4));
  return true;
}
