import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function main() {
    try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        console.log("Successfully connected to Gemini API.");
        console.log("Testing model access by generating a short text...");
        
        const result = await model.generateContent("Hello! Say 'Gemini is working!' if you can hear me.");
        console.log("Model response:", result.response.text());
    } catch (e) {
        console.error("Error connecting to Gemini:", e);
    }





}
main();
