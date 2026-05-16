import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Document Analysis Service
 * Handles PDF and text file uploads for AI analysis
 */
export class DocumentAnalysisService {
  private gemini: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is required");
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Analyze a document from base64 data
   */
  analyzeDocument = async (
    base64Data: string,
    mimeType: string,
    fileName: string,
    userPrompt: string
  ): Promise<string> => {
    console.log(`[DocumentAnalysis] Analyzing: ${fileName} (${mimeType})`);

    const supportedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/html",
    ];

    if (!supportedTypes.includes(mimeType)) {
      throw new Error(
        `Unsupported file type: ${mimeType}. Supported: PDF, TXT, MD, HTML`
      );
    }

    const systemPrompt = `You are an expert document analyst and writing assistant. 
When analyzing documents:
- Extract key information, themes, and insights
- Identify the document type and purpose
- Highlight important sections
- Provide actionable recommendations
- Answer specific questions about the content accurately`;

    const prompt = userPrompt || "Please analyze this document and provide a comprehensive summary, key insights, and any recommendations.";

    const model = this.gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    const text = response.response.text();
    if (!text) throw new Error("No response from Gemini for document analysis");

    return text;
  };

  /**
   * Extract and summarize text from a document
   */
  summarizeDocument = async (
    base64Data: string,
    mimeType: string,
    summaryLength: "brief" | "detailed" | "bullet_points" = "detailed"
  ): Promise<string> => {
    const lengthInstructions = {
      brief: "Provide a 2-3 sentence summary of the key points.",
      detailed:
        "Provide a comprehensive summary covering: main topics, key arguments, important data/findings, and conclusions.",
      bullet_points:
        "Provide a structured summary as bullet points organized by topic/section.",
    };

    return this.analyzeDocument(
      base64Data,
      mimeType,
      "document",
      `${lengthInstructions[summaryLength]} Be accurate and preserve important details.`
    );
  };
}

export const documentAnalysisService = new DocumentAnalysisService();