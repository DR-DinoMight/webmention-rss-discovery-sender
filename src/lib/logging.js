"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertLogEntry = exports.referenceLinkExists = exports.fetchLogEntry = void 0;
const fs_1 = __importDefault(require("fs"));
const createLogFileIfNotExists = (logFileLocation) => {
    if (!fs_1.default.existsSync(logFileLocation)) {
        fs_1.default.writeFileSync(logFileLocation, JSON.stringify([]));
    }
};
const fetchLogFile = (logFileLocation, createIfNotExists = true) => {
    if (createIfNotExists) {
        createLogFileIfNotExists(logFileLocation);
    }
    return JSON.parse(fs_1.default.readFileSync(logFileLocation).toString());
};
const fetchLogEntry = (logFileLocation, srcLink) => __awaiter(void 0, void 0, void 0, function* () {
    const log = yield fetchLogFile(logFileLocation);
    if (!log)
        return;
    const logEntry = log.find(entry => entry.srcLink === srcLink);
    if (!logEntry)
        return;
    return logEntry;
});
exports.fetchLogEntry = fetchLogEntry;
const referenceLinkExists = (logFileLocation, logEntrySrcLink, referenceLink) => __awaiter(void 0, void 0, void 0, function* () {
    const logEntry = yield (0, exports.fetchLogEntry)(logFileLocation, logEntrySrcLink);
    if (!logEntry)
        return false;
    return logEntry.referencedLinks.some(link => link.url === referenceLink);
});
exports.referenceLinkExists = referenceLinkExists;
const upsertLogEntry = (logFileLocation, feedLogEntry) => __awaiter(void 0, void 0, void 0, function* () {
    const log = yield fetchLogFile(logFileLocation);
    const logEntry = log.find(entry => entry.srcLink === feedLogEntry.srcLink);
    // If the log entry exists, update it
    if (logEntry) {
        log.splice(log.indexOf(logEntry), 1, feedLogEntry);
    }
    else {
        log.push(feedLogEntry);
    }
    if (log)
        fs_1.default.writeFileSync(logFileLocation, JSON.stringify(log, null, 4));
    return true;
});
exports.upsertLogEntry = upsertLogEntry;
