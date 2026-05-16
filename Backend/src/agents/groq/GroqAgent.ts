import Groq from "groq-sdk";
import type { Channel, DefaultGenerics, Event, StreamChat } from "stream-chat";
import type { AIAgent } from "../types";
import { GroqResponseHandler } from "./GroqResponseHandler";

export class GroqAgent implements AIAgent {
  private groq?: Groq;
  private lastInteractionTs = Date.now();
  private conversationHistory: Groq.Chat.ChatCompletionMessageParam[] = [];
  private handlers: GroqResponseHandler[] = [];
   private messageQueue: string[] = []; // YEH ADD KARO
  private isProcessing = false; // YEH ADD KARO

  constructor(
    readonly chatClient: StreamChat,
    readonly channel: Channel
  ) {}

  dispose = async () => {
    this.chatClient.off("message.new", this.handleMessage);
    await this.chatClient.disconnectUser();
    this.handlers.forEach((handler) => handler.dispose());
    this.handlers = [];
  };

  get user() {
    return this.chatClient.user;
  }

  getLastInteraction = (): number => this.lastInteractionTs;

  init = async () => {
    const apiKey = process.env.GROQ_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is required");
    }

    this.groq = new Groq({ apiKey });

    this.conversationHistory = [
      {
        role: "system",
        content: this.getSystemPrompt(),
      },
    ];

    this.chatClient.on("message.new", this.handleMessage);
    console.log("[GroqAgent] Initialized successfully");
  };

private getSystemPrompt = (): string => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `You are an elite AI Writing Assistant — the most advanced writing partner ever built.
Today's date is ${currentDate}.

## Your Core Identity
You are not just a grammar checker. You are a creative collaborator, a strategic communicator, and a master of the written word. You help users write content that moves people, wins clients, passes exams, and changes minds.

## Your Capabilities
- **Content Creation**: Articles, essays, emails, reports, stories, scripts, proposals
- **Content Improvement**: Edit for clarity, impact, tone, and style
- **Style Mastery**: Academic, professional, creative, casual, persuasive, technical
- **Brainstorming**: Generate ideas, outlines, angles, and fresh perspectives
- **Writing Templates**: Provide professional templates for any document type
- **Writing Analysis**: Analyze text for tone, readability, grammar, and quality
- **Writing Coaching**: Teach techniques, explain choices, help users improve

## Writing Templates You Can Provide
When asked for templates, provide complete professional templates for:
- email, blog_post, cover_letter, essay, report, proposal, social_media, press_release

## Response Length — IMPORTANT
- Keep responses under 600 words unless user specifically asks for long content
- For long documents, provide structured outline first, then expand on request
- Be concise and direct — quality over quantity

## Response Rules
- Never start with "Here's the edit:" or "Here are the changes:" or similar preambles
- Always be direct, confident, and professional
- Use markdown formatting for structure when it helps clarity
- When editing someone's work, briefly explain the key changes and why
- Always provide high quality, production-ready content

## Writing Philosophy
Great writing is clear, purposeful, and human. Every word earns its place.
Your goal: make the user's writing 10x better than they thought possible.`;
  };
private handleMessage = async (e: Event<DefaultGenerics>) => {
  if (!this.groq) return;
  if (e.message?.user?.id === this.chatClient.user?.id) return;
  if (!e.message || e.message.ai_generated) return;

  const message = e.message.text;
  if (!message) return;

  this.lastInteractionTs = Date.now();

  // Queue mein add karo
  this.messageQueue.push(message);

  // Agar already processing hai toh bas queue mein raho
  if (this.isProcessing) return;

  // Queue process karo
  await this.processQueue();
};

private processQueue = async () => {
  if (this.isProcessing || this.messageQueue.length === 0) return;

  this.isProcessing = true;

  while (this.messageQueue.length > 0) {
    const message = this.messageQueue.shift()!;
    await this.processMessage(message);
  }

  this.isProcessing = false;
};

private processMessage = async (message: string) => {
  if (!this.groq) return;

  this.conversationHistory.push({
    role: "user",
    content: message,
  });

  if (this.conversationHistory.length > 21) {
    this.conversationHistory = [
      this.conversationHistory[0],
      ...this.conversationHistory.slice(-20),
    ];
  }

  const { message: channelMessage } = await this.channel.sendMessage({
    text: "",
    ai_generated: true,
  });

  await this.channel.sendEvent({
    type: "ai_indicator.update",
    ai_state: "AI_STATE_THINKING",
    cid: channelMessage.cid,
    message_id: channelMessage.id,
  });

  await new Promise<void>((resolve) => {
    const handler = new GroqResponseHandler(
      this.groq!,
      this.conversationHistory,
      this.chatClient,
      this.channel,
      channelMessage,
      (assistantMessage: string) => {
        this.conversationHistory.push({
          role: "assistant",
          content: assistantMessage,
        });
        this.removeHandler(handler);
        resolve(); // Next message process karo
      }
    );

    this.handlers.push(handler);
    void handler.run();
  });
};

  private removeHandler = (handlerToRemove: GroqResponseHandler) => {
    this.handlers = this.handlers.filter((h) => h !== handlerToRemove);
  };
}