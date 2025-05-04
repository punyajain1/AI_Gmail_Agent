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
Object.defineProperty(exports, "__esModule", { value: true });
const gmail_1 = require("./gmail");
const agent_1 = require("./agent");
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gmail = yield (0, gmail_1.getGmailClient)();
        const emails = yield (0, gmail_1.getUnreadEmails)(gmail);
        // Generate email summaries and save to CSV if there are any emails
        if (emails.length > 0) {
            console.log(`📊 Generating email summaries CSV...`);
            const csvPath = yield (0, gmail_1.generateAndSaveEmailSummaries)(emails);
            console.log(`📝 Email summaries saved to: ${csvPath}`);
        }
        else {
            console.log(`ℹ️ No emails to summarize.`);
        }
        // Continue with your existing workflow to create drafts
        for (const email of emails) {
            console.log(`\n\n📩 New email from ${email.from}`);
            const reply = yield (0, agent_1.generateReply)(email.body);
            const replyText = typeof reply === 'string' ? reply : JSON.stringify(reply);
            console.log(`🤖 Drafting reply...\n${replyText}\n\n`);
            yield (0, gmail_1.createDraft)(gmail, email.from, email.subject, replyText);
        }
        console.log("✅ All drafts created. Check your Gmail Drafts folder.");
    }
    catch (error) {
        console.error("❌ Error in email processing:", error);
    }
}))();
