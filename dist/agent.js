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
exports.generateReply = generateReply;
exports.generateSummary = generateSummary;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const chat = new openai_1.ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: "gpt-4o",
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL
    }
});
function generateReply(emailBody) {
    return __awaiter(this, void 0, void 0, function* () {
        const prompt = `You are a professional assistant. Draft a polite and appropriate reply to this email:\n\n"${emailBody}"`;
        const response = yield chat.call([new messages_1.HumanMessage(prompt)]);
        return response.content;
    });
}
function generateSummary(emailBody) {
    return __awaiter(this, void 0, void 0, function* () {
        const prompt = `Summarize the following email in a short, concise sentence (max 50 words):\n\n"${emailBody}"`;
        const response = yield chat.call([new messages_1.HumanMessage(prompt)]);
        return response.content;
    });
}
