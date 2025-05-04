import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import { generateSummary } from './agent';
import { createObjectCsvWriter } from 'csv-writer';

const SCOPES = process.env["SCOPE_URL"] ? [process.env["SCOPE_URL"]] : [];
const TOKEN_PATH = path.join(__dirname, '../token.json');

export async function getGmailClient() {
  try {
    const credentialsFile = JSON.parse(fs.readFileSync('./client.json', 'utf-8'));
    console.log("creds-", credentialsFile);

    const credentials = credentialsFile.installed;
    if (!credentials) {
      throw new Error('Invalid credentials file format: missing web or installed property');
    }
    
    const { client_secret, client_id, redirect_uris } = credentials;

    const redirect_uri = redirect_uris && redirect_uris.length > 0 
      ? redirect_uris[0] 
      : 'http://localhost';
    
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

    try {
      if (fs.existsSync(TOKEN_PATH)) {
        const tokenData = fs.readFileSync(TOKEN_PATH, 'utf-8');
        if (tokenData && tokenData.trim()) {
          oAuth2Client.setCredentials(JSON.parse(tokenData));
        } else {
          throw new Error('Token file is empty');
        }
      } else {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const code = await new Promise<string>((resolve) => rl.question('Enter the code: ', (code) => {
          rl.close();
          resolve(code);
        }));

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      }

      return google.gmail({ version: 'v1', auth: oAuth2Client });
    } catch (error) {
      console.error('Error with token file:', error);
      
      
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });

      console.log('Authorize this app by visiting this url:', authUrl);

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const code = await new Promise<string>((resolve) => rl.question('Enter the code: ', (code) => {
        rl.close();
        resolve(code);
      }));

      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      
      return google.gmail({ version: 'v1', auth: oAuth2Client });
    }
  } catch (error) {
    console.error('Error reading credentials file:', error);
    throw new Error('Failed to initialize Gmail client: Invalid credentials file');
  }
}

export async function getUnreadEmails(gmail: any) {
  const res = await gmail.users.messages.list({
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
    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'full' });
    
    const messageLabels = full.data.labelIds || [];
    const hasExcludedLabel = messageLabels.some((label: string) => excludedLabels.includes(label));
    
    if (!hasExcludedLabel) {
      const payload = full.data.payload!;
      const headers = payload.headers!;
      const from = headers.find((h: {name: string, value?: string}) => h.name === 'From')?.value || '';
      const subject = headers.find((h: {name: string, value?: string}) => h.name === 'Subject')?.value || '';
      const data = payload.parts?.[0]?.body?.data || payload.body?.data;
      const body = Buffer.from(data!, 'base64').toString('utf-8');
      filteredResults.push({ id: msg.id!, from, subject, body });
    }
  }

  return filteredResults.slice(0, 3);
}



export async function generateAndSaveEmailSummaries(emails: Array<{id: string, from: string, subject: string, body: string}>) {
  // Create directory if it doesn't exist
  const csvDir = path.join(__dirname, '../csv');
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir);
  }

  // Generate a filename with current date and time
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvFilePath = path.join(csvDir, `email-summaries-${timestamp}.csv`);

  const csvWriter = createObjectCsvWriter({
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
    const summary = await generateSummary(email.body);
    records.push({
      id: email.id,
      from: email.from,
      subject: email.subject,
      summary
    });
  }

  await csvWriter.writeRecords(records);
  console.log(`✅ Email summaries saved to: ${csvFilePath}`);
  return csvFilePath;
}

export async function createDraft(gmail: any, to: string, subject: string, messageText: string) {
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: Re: ${subject}\r\n\r\n${messageText}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw } }
  });

  console.log(`✅ Draft created for: ${to}`);
}
