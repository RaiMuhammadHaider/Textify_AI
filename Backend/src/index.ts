import cors from "cors";
import "dotenv/config";
import express from "express";
import Groq from "groq-sdk";
import { createAgent } from "./agents/createAgent";
import { AgentPlatform, AIAgent, ChatSummaryRequest } from "./agents/types";
// import { fileUploadService } from "./services/FileUploadService";
import { FileUploadService } from "./agents/services/FileUploadService";
// import { WritingTemplatesService } from "./services/WritingTemplatesService";
import { WritingTemplatesService } from "./agents/services/WritingTemplatesService";
// import { DuckDuckGoService } from "./services/DuckDuckGoService";
import { DuckDuckGoService } from "./agents/services/DuckDuckGoService";
import { apiKey, serverClient } from "./serverClient";

const app = express();
// import { FileUploadService } from "./services/FileUploadService";
const fileUploadService = new FileUploadService();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cors({ origin: "*" }));

const aiAgentCache = new Map<string, AIAgent>();
const pendingAiAgents = new Set<string>();
const inactivityThreshold = 480 * 60 * 1000;

setInterval(async () => {
  const now = Date.now();
  for (const [userId, aiAgent] of aiAgentCache) {
    if (now - aiAgent.getLastInteraction() > inactivityThreshold) {
      console.log(`[Cleanup] Disposing inactive agent: ${userId}`);
      await disposeAiAgent(aiAgent);
      aiAgentCache.delete(userId);
    }
  }
}, 5000);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "AI Writing Assistant Server",
    version: "2.0.0",
    provider: "Groq - llama-3.3-70b-versatile",
    features: [
      "streaming_responses",
      "duckduckgo_search",
      "writing_templates",
      "chat_summary",
      "writing_analysis",
      "conversation_memory",
    ],
    activeAgents: aiAgentCache.size,
    timestamp: new Date().toISOString(),
  });
});

// Start agent
app.post("/start-ai-agent", async (req, res) => {
  const { channel_id, channel_type = "messaging" } = req.body;
  console.log(`[API] /start-ai-agent → channel: ${channel_id}`);

  if (!channel_id) {
    res.status(400).json({ error: "Missing channel_id" });
    return;
  }

  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`;

  try {
    if (!aiAgentCache.has(user_id) && !pendingAiAgents.has(user_id)) {
      pendingAiAgents.add(user_id);

      await serverClient.upsertUser({
        id: user_id,
        name: "AI Writing Assistant",
      });

      const channel = serverClient.channel(channel_type, channel_id);
      await channel.addMembers([user_id]);

      const agent = await createAgent(
        user_id,
        AgentPlatform.GROQ,
        channel_type,
        channel_id
      );

      await agent.init();

      if (aiAgentCache.has(user_id)) {
        await agent.dispose();
      } else {
        aiAgentCache.set(user_id, agent);
      }
    } else {
      console.log(`[API] Agent ${user_id} already running`);
    }

    res.json({ message: "AI Agent started", provider: "groq" });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("[API] Failed to start agent:", errorMessage);
    res.status(500).json({ error: "Failed to start AI Agent", reason: errorMessage });
  } finally {
    pendingAiAgents.delete(user_id);
  }
});

// Stop agent
app.post("/stop-ai-agent", async (req, res) => {
  const { channel_id } = req.body;
  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`;

  try {
    const aiAgent = aiAgentCache.get(user_id);
    if (aiAgent) {
      await disposeAiAgent(aiAgent);
      aiAgentCache.delete(user_id);
    }
    res.json({ message: "AI Agent stopped" });
  } catch (error) {
    res.status(500).json({ error: "Failed to stop AI Agent", reason: (error as Error).message });
  }
});

// Agent status
app.get("/agent-status", (req, res) => {
  const { channel_id } = req.query;
  if (!channel_id || typeof channel_id !== "string") {
    return res.status(400).json({ error: "Missing channel_id" });
  }
  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`;

  if (aiAgentCache.has(user_id)) {
    res.json({ status: "connected", provider: "groq" });
  } else if (pendingAiAgents.has(user_id)) {
    res.json({ status: "connecting" });
  } else {
    res.json({ status: "disconnected" });
  }
});

// Token
app.post("/token", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const now = Math.floor(Date.now() / 1000);
    const issuedAt = now - 60;
    const expiration = now + 60 * 60;
    const token = serverClient.createToken(userId, expiration, issuedAt);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Web search
app.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const results = await DuckDuckGoService.search(query);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: "Search failed", reason: (error as Error).message });
  }
});

// Templates list
app.get("/templates", (req, res) => {
  const templates = WritingTemplatesService.getAllTemplates();
  res.json({ templates });
});

// Get specific template
app.get("/templates/:type", (req, res) => {
  const { type } = req.params;
  const { context } = req.query;
  const template = WritingTemplatesService.getTemplate(type, context as string | undefined);
  res.json({ template });
});

// Apply template to channel
app.post("/templates/apply", async (req, res) => {
  const { templateType, context, channelId, channelType = "messaging" } = req.body;

  if (!templateType || !channelId) {
    return res.status(400).json({ error: "Missing templateType or channelId" });
  }

  try {
    const template = WritingTemplatesService.getTemplate(templateType, context) as any;
    if (template.error) return res.status(404).json(template);

    const messageText = `📝 **${template.name} Template**\n\n${template.structure}\n\n---\n**Pro Tips:**\n${template.pro_tips?.map((t: string) => `• ${t}`).join("\n")}`;

    const channel = serverClient.channel(channelType, channelId);
    await channel.sendMessage({ text: messageText, ai_generated: true });

    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ error: "Failed to apply template", reason: (error as Error).message });
  }
});

// Chat summary using Groq
app.post("/summarize-chat", async (req, res) => {
  const { channelId, channelType = "messaging", messageLimit = 50 } =
    req.body as ChatSummaryRequest;

  if (!channelId) return res.status(400).json({ error: "Missing channelId" });

  console.log(`[API] /summarize-chat → channel: ${channelId}`);

  try {
    const channel = serverClient.channel(channelType, channelId);
    await channel.watch();

    const response = await channel.query({ messages: { limit: messageLimit } });
    const messages = response.messages || [];

    if (messages.length === 0) {
      return res.json({ success: true, summary: "No messages found.", messageCount: 0 });
    }

    const conversationText = messages
      .filter((m) => m.text?.trim())
      .map((m) => {
        const role = m.user?.id?.startsWith("ai-bot") ? "AI Assistant" : m.user?.name || "User";
        return `${role}: ${m.text}`;
      })
      .join("\n\n");

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const summaryResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert at summarizing writing sessions. Be concise and organized.",
        },
        {
          role: "user",
          content: `Summarize this writing session. Include:
1. **Main Topics**: What writing tasks were worked on
2. **Content Created**: What was written or edited
3. **Key Decisions**: Important choices made
4. **Next Steps**: Any unfinished tasks

CONVERSATION:
${conversationText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const summary = summaryResponse.choices[0]?.message?.content || "Unable to generate summary.";

    await channel.sendMessage({
      text: `📊 **Session Summary**\n\n${summary}`,
      ai_generated: true,
    });

    res.json({ success: true, summary, messageCount: messages.length });
  } catch (error) {
    console.error("[API] Chat summary failed:", error);
    res.status(500).json({ error: "Failed to generate summary", reason: (error as Error).message });
  }
});

app.post("/analyze-file", async (req, res) => {
  const { base64Data, mimeType, fileName, prompt, channelId, channelType = "messaging" } = req.body;

  if (!base64Data || !mimeType || !channelId) {
    return res.status(400).json({
      error: "Missing required fields: base64Data, mimeType, channelId",
    });
  }

  console.log(`[API] /analyze-file → ${fileName} (${mimeType})`);

  try {
    let analysis = "";
    let fileIcon = "📄";

    if (mimeType === "application/pdf") {
      fileIcon = "📄";
analysis = await fileUploadService.analyzePDF(base64Data, fileName, prompt);
    } else if (mimeType.startsWith("image/")) {
      fileIcon = "🖼️";
      analysis = await fileUploadService.analyzeImage(base64Data, mimeType, fileName, prompt);
    } else {
      return res.status(400).json({
        error: `Unsupported file type: ${mimeType}`,
      });
    }

    const channel = serverClient.channel(channelType, channelId);
    await channel.sendMessage({
  text: `${fileIcon} **File Analysis: ${fileName}**\n\n${analysis}`,
  ai_generated: true,
  user_id: `ai-bot-${channelId.replace(/[!]/g, "")}`,
});

    res.json({ success: true, fileName, mimeType, analysis });
  } catch (error) {
    console.error("[API] File analysis failed:", error);
    res.status(500).json({
      error: "File analysis failed",
      reason: (error as Error).message,
    });
  }
});

// Writing analysis using Groq
app.post("/analyze-writing", async (req, res) => {
  const { text, channelId, channelType = "messaging" } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const analysisResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a writing analysis expert. Always respond with valid JSON only, no markdown.",
        },
        {
          role: "user",
          content: `Analyze this text and return ONLY a JSON object:
{
  "overall_score": <1-10>,
  "readability": { "score": <1-10>, "level": "<Very Easy|Easy|Standard|Fairly Difficult|Difficult>", "feedback": "<feedback>" },
  "tone": { "primary": "<professional|casual|academic|persuasive|creative>", "sentiment": "<positive|neutral|negative|mixed>", "feedback": "<feedback>" },
  "grammar": { "score": <1-10>, "issues_found": <number>, "issues": ["<issue>"] },
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "stats": { "word_count": <number>, "sentence_count": <number>, "reading_time_minutes": <number> }
}

TEXT:
${text}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const rawResponse = analysisResponse.choices[0]?.message?.content || "{}";

    let analysisData;
    try {
      const cleanJson = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
      analysisData = JSON.parse(cleanJson);
    } catch {
      analysisData = { error: "Failed to parse analysis" };
    }

    if (channelId && !analysisData.error) {
      const msg = `📊 **Writing Analysis**

**Overall Score:** ${analysisData.overall_score}/10

**Readability:** ${analysisData.readability?.level} (${analysisData.readability?.score}/10)
${analysisData.readability?.feedback}

**Tone:** ${analysisData.tone?.primary} • ${analysisData.tone?.sentiment}
${analysisData.tone?.feedback}

**Grammar Score:** ${analysisData.grammar?.score}/10 (${analysisData.grammar?.issues_found} issues)
${analysisData.grammar?.issues?.map((i: string) => `• ${i}`).join("\n") || "No major issues"}

**Strengths:**
${analysisData.strengths?.map((s: string) => `✅ ${s}`).join("\n")}

**Improvements:**
${analysisData.improvements?.map((i: string) => `💡 ${i}`).join("\n")}

**Stats:** ${analysisData.stats?.word_count} words • ${analysisData.stats?.sentence_count} sentences • ~${analysisData.stats?.reading_time_minutes} min read`;

      const channel = serverClient.channel(channelType, channelId);
      await channel.sendMessage({ text: msg, ai_generated: true });
    }

    res.json({ success: true, analysis: analysisData });
  } catch (error) {
    res.status(500).json({ error: "Analysis failed", reason: (error as Error).message });
  }
});

async function disposeAiAgent(aiAgent: AIAgent) {
  await aiAgent.dispose();
  if (!aiAgent.user) return;
  await serverClient.deleteUser(aiAgent.user.id, { hard_delete: true });
}

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`\n🚀 AI Writing Assistant Server v2.0`);
  console.log(`📍 Running on http://localhost:${port}`);
  console.log(`🤖 Provider: Groq - llama-3.3-70b-versatile (FREE)`);
  console.log(`🔍 Search: DuckDuckGo (FREE)`);
  console.log(`📄 Features: Templates, Chat Summary, Writing Analysis\n`);
});
