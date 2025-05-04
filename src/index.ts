import { getGmailClient, getUnreadEmails, createDraft, generateAndSaveEmailSummaries } from './gmail';
import { generateReply } from './agent';

(async () => {
  try {
    const gmail = await getGmailClient();
    const emails = await getUnreadEmails(gmail);
    
    // Generate email summaries and save to CSV if there are any emails
    if (emails.length > 0) {
      console.log(`📊 Generating email summaries CSV...`);
      const csvPath = await generateAndSaveEmailSummaries(emails);
      console.log(`📝 Email summaries saved to: ${csvPath}`);
    } else {
      console.log(`ℹ️ No emails to summarize.`);
    }

    // Continue with your existing workflow to create drafts
    for (const email of emails) {
      console.log(`\n\n📩 New email from ${email.from}`);
      const reply = await generateReply(email.body);
      const replyText = typeof reply === 'string' ? reply : JSON.stringify(reply);
      console.log(`🤖 Drafting reply...\n${replyText}\n\n`);
      await createDraft(gmail, email.from, email.subject, replyText);
    }

    console.log("✅ All drafts created. Check your Gmail Drafts folder.");
  } catch (error) {
    console.error("❌ Error in email processing:", error);
  }
})();
