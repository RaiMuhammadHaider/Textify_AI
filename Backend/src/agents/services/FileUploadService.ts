import Groq from "groq-sdk";
// import pdfParse from "pdf-parse";
// import * as pdfParse from "pdf-parse";
const pdfParse = require("pdf-parse")

export class FileUploadService {
  private groq: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is required");
    this.groq = new Groq({ apiKey });
  }

  // PDF Analysis
  analyzePDF = async (
    base64Data: string,
    fileName: string,
    userPrompt?: string
  ): Promise<string> => {
    console.log(`[FileUploadService] Analyzing PDF: ${fileName}`);

    const buffer = Buffer.from(base64Data, "base64");
const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("Could not extract text from PDF. The file may be scanned or image-based.");
    }

    const truncatedText = extractedText.length > 8000
      ? extractedText.substring(0, 8000) + "\n\n[Document truncated for analysis...]"
      : extractedText;

    const prompt = userPrompt || "Please analyze this document and provide a comprehensive summary with key insights, main topics, and any important information.";

    const response = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert document analyst and writing assistant. 
When analyzing documents:
- Extract key information, themes, and insights
- Identify the document type and purpose  
- Highlight important sections and data
- Provide actionable recommendations
- Be thorough but concise (under 600 words)`,
        },
        {
          role: "user",
          content: `Document: "${fileName}"\n\nContent:\n${truncatedText}\n\n---\n\n${prompt}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return response.choices[0]?.message?.content || "Unable to analyze document.";
  };

  // Image Analysis
  analyzeImage = async (
    base64Data: string,
    mimeType: string,
    fileName: string,
    userPrompt?: string
  ): Promise<string> => {
    console.log(`[FileUploadService] Analyzing image: ${fileName}`);

    const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!supportedTypes.includes(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType}. Use JPEG, PNG, GIF, or WebP.`);
    }

    const prompt = userPrompt || "Please analyze this image in detail. Describe what you see, extract any text, and provide insights about the content.";

    const response = await this.groq.chat.completions.create({
    //   model: "llama-3.2-90b-vision-preview",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return response.choices[0]?.message?.content || "Unable to analyze image.";
  };
}

// export const fileUploadService = new FileUploadService();