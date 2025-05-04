import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';
dotenv.config();

const chat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  temperature: 0.7,
  modelName: "gpt-4o",
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL
  }
});

export async function generateReply(emailBody: string) {
  const prompt = `You are a professional assistant. Draft a polite and appropriate reply to this email:\n\n"${emailBody}"`;
  const response = await chat.call([new HumanMessage(prompt)]);
  return response.content;
}

export async function generateSummary(emailBody: string) {
  const prompt = `Summarize the following email in a short, concise sentence (max 50 words):\n\n"${emailBody}"`;
  const response = await chat.call([new HumanMessage(prompt)]);
  return response.content;
}