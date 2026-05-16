import Groq from "groq-sdk";
import type { Channel, Event, MessageResponse, StreamChat } from "stream-chat";

export class GroqResponseHandler {
  private message_text = "";
  private is_done = false;
  private last_update_time = 0;

  constructor(
    private readonly groq: Groq,
    private readonly conversationHistory: Groq.Chat.ChatCompletionMessageParam[],
    private readonly chatClient: StreamChat,
    private readonly channel: Channel,
    private readonly message: MessageResponse,
    private readonly onDispose: (assistantMessage: string) => void
  ) {
    this.chatClient.on("ai_indicator.stop", this.handleStopGenerating);
  }

  private truncateForStream = (text: string): string => {
    if (text.length <= 4900) return text;
    return text.substring(0, 4900) + "...";
  };

  run = async () => {
    const { cid, id: message_id } = this.message;

    try {
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_GENERATING",
        cid,
        message_id,
      });

      const stream = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: this.conversationHistory,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });

      for await (const chunk of stream) {
        if (this.is_done) break;

        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          this.message_text += delta;

          const now = Date.now();
          if (now - this.last_update_time > 800) {
            await this.chatClient.partialUpdateMessage(message_id, {
              set: { text: this.truncateForStream(this.message_text) },
            });
            this.last_update_time = now;
          }
        }

        if (chunk.choices[0]?.finish_reason === "stop") break;
      }

      if (!this.is_done) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        await this.chatClient.partialUpdateMessage(message_id, {
          set: { text: this.truncateForStream(this.message_text) },
        });

        await this.channel.sendEvent({
          type: "ai_indicator.clear",
          cid,
          message_id,
        });
      }
    } catch (error) {
      console.error("[GroqResponseHandler] Error:", error);
      await this.handleError(error as Error);
    } finally {
      await this.dispose();
    }
  };

  dispose = async () => {
    if (this.is_done) return;
    this.is_done = true;
    this.chatClient.off("ai_indicator.stop", this.handleStopGenerating);
    this.onDispose(this.message_text);
  };

  private handleStopGenerating = async (event: Event) => {
    if (this.is_done || event.message_id !== this.message.id) return;

    this.is_done = true;

    await this.chatClient.partialUpdateMessage(this.message.id, {
      set: {
        text: this.truncateForStream(this.message_text) || "Generation stopped.",
      },
    });

    await this.channel.sendEvent({
      type: "ai_indicator.clear",
      cid: this.message.cid,
      message_id: this.message.id,
    });

    await this.dispose();
  };

  private handleError = async (error: Error) => {
    if (this.is_done) return;

    await this.channel.sendEvent({
      type: "ai_indicator.update",
      ai_state: "AI_STATE_ERROR",
      cid: this.message.cid,
      message_id: this.message.id,
    });

    await this.chatClient.partialUpdateMessage(this.message.id, {
      set: {
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
      },
    });
  };
}