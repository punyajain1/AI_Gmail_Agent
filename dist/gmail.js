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
exports.getGmailClient = getGmailClient;
exports.getUnreadEmails = getUnreadEmails;
exports.generateAndSaveEmailSummaries = generateAndSaveEmailSummaries;
exports.createDraft = createDraft;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const googleapis_1 = require("googleapis");
const agent_1 = require("./agent");
const csv_writer_1 = require("csv-writer");
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path_1.default.join(__dirname, '../token.json');
function getGmailClient() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const credentialsFile = JSON.parse(fs_1.default.readFileSync('./client.json', 'utf-8'));
            console.log("creds-", credentialsFile);
            // Determine if we're using web or desktop credentials
            const credentials = credentialsFile.installed;
            if (!credentials) {
                throw new Error('Invalid credentials file format: missing web or installed property');
            }
            const { client_secret, client_id, redirect_uris } = credentials;
            // Use the first redirect URI from the credentials file
            const redirect_uri = redirect_uris && redirect_uris.length > 0
                ? redirect_uris[0]
                : 'http://localhost';
            const oAuth2Client = new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uri);
            try {
                if (fs_1.default.existsSync(TOKEN_PATH)) {
                    const tokenData = fs_1.default.readFileSync(TOKEN_PATH, 'utf-8');
                    if (tokenData && tokenData.trim()) {
                        oAuth2Client.setCredentials(JSON.parse(tokenData));
                    }
                    else {
                        throw new Error('Token file is empty');
                    }
                }
                else {
                    const authUrl = oAuth2Client.generateAuthUrl({
                        access_type: 'offline',
                        scope: SCOPES,
                    });
                    console.log('Authorize this app by visiting this url:', authUrl);
                    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
                    const code = yield new Promise((resolve) => rl.question('Enter the code: ', (code) => {
                        rl.close();
                        resolve(code);
                    }));
                    const { tokens } = yield oAuth2Client.getToken(code);
                    oAuth2Client.setCredentials(tokens);
                    fs_1.default.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
                }
                return googleapis_1.google.gmail({ version: 'v1', auth: oAuth2Client });
            }
            catch (error) {
                console.error('Error with token file:', error);
                const authUrl = oAuth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: SCOPES,
                });
                console.log('Authorize this app by visiting this url:', authUrl);
                const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
                const code = yield new Promise((resolve) => rl.question('Enter the code: ', (code) => {
                    rl.close();
                    resolve(code);
                }));
                const { tokens } = yield oAuth2Client.getToken(code);
                oAuth2Client.setCredentials(tokens);
                fs_1.default.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
                return googleapis_1.google.gmail({ version: 'v1', auth: oAuth2Client });
            }
        }
        catch (error) {
            console.error('Error reading credentials file:', error);
            throw new Error('Failed to initialize Gmail client: Invalid credentials file');
        }
    });
}
function getUnreadEmails(gmail) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const res = yield gmail.users.messages.list({
            userId: 'me',
            labelIds: ['INBOX', 'UNREAD'],
            maxResults: 10,
        });
        const messages = res.data.messages || [];
        const excludedLabels = [
            'CATEGORY_SOCIAL',
            'CATEGORY_PROMOTIONS',
            'CATEGORY_UPDATES',
            'SPAM'
        ];
        const filteredResults = [];
        for (const msg of messages) {
            const full = yield gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
            const messageLabels = full.data.labelIds || [];
            const hasExcludedLabel = messageLabels.some((label) => excludedLabels.includes(label));
            if (!hasExcludedLabel) {
                const payload = full.data.payload;
                const headers = payload.headers;
                const from = ((_a = headers.find((h) => h.name === 'From')) === null || _a === void 0 ? void 0 : _a.value) || '';
                const subject = ((_b = headers.find((h) => h.name === 'Subject')) === null || _b === void 0 ? void 0 : _b.value) || '';
                const data = ((_e = (_d = (_c = payload.parts) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.body) === null || _e === void 0 ? void 0 : _e.data) || ((_f = payload.body) === null || _f === void 0 ? void 0 : _f.data);
                const body = Buffer.from(data, 'base64').toString('utf-8');
                filteredResults.push({ id: msg.id, from, subject, body });
            }
        }
        return filteredResults.slice(0, 3);
    });
}
function generateAndSaveEmailSummaries(emails) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create directory if it doesn't exist
        const csvDir = path_1.default.join(__dirname, '../csv');
        if (!fs_1.default.existsSync(csvDir)) {
            fs_1.default.mkdirSync(csvDir);
        }
        // Generate a filename with current date and time
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvFilePath = path_1.default.join(csvDir, `email-summaries-${timestamp}.csv`);
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: csvFilePath,
            header: [
                { id: 'id', title: 'ID' },
                { id: 'from', title: 'From' },
                { id: 'subject', title: 'Subject' },
                { id: 'summary', title: 'Summary' }
            ]
        });
        const records = [];
        for (const email of emails) {
            const summary = yield (0, agent_1.generateSummary)(email.body);
            records.push({
                id: email.id,
                from: email.from,
                subject: email.subject,
                summary
            });
        }
        yield csvWriter.writeRecords(records);
        console.log(`✅ Email summaries saved to: ${csvFilePath}`);
        return csvFilePath;
    });
}
function createDraft(gmail, to, subject, messageText) {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = Buffer.from(`To: ${to}\r\nSubject: Re: ${subject}\r\n\r\n${messageText}`).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        yield gmail.users.drafts.create({
            userId: 'me',
            requestBody: { message: { raw } }
        });
        console.log(`✅ Draft created for: ${to}`);
    });
}
