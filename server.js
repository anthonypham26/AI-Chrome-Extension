const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");  
const { getGeminiResponse } = require("./gemini");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 

// Gemini chat endpoint
app.post("/api/chat", async (req, res) => {
    try {
        const { message, context = {} } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const messages = [
            {
                role: "system",
                content: `You are an AI writing assistant. Complete the user's text naturally, continuing their thought or sentence. 
                          Respond ONLY with the completion text, no explanations or additional content. Keep the completion concise and relevant.

                          Current webpage context:
                          ${JSON.stringify(context)}
                         `
            },
            {
                role: "user",
                content: message
            }
        ];

        // Call Gemini API
        const aiResponse = await getGeminiResponse(messages);
        res.json({ response: aiResponse });

    } catch (error) {
        console.error("🚨 API Fetch Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});
