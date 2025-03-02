const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

// Load API Key
dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Google Gemini AI Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getGeminiResponse(messages) {
    try {
        // Convert messages into a prompt
        const prompt = messages.map(msg => msg.content).join("\n");

        // Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response.text(); // Extract AI response

        console.log("🔹 Gemini API Response:", response);
        return response || "No response from AI";
        
    } catch (error) {
        console.error("🚨 Gemini API Fetch Error:", error);
        return "Error fetching response from Gemini API";
    }
}

// Export function
module.exports = { getGeminiResponse };
