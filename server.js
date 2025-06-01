require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Initial check during server startup (optional, but good for early feedback)
if (!GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY is not defined in environment variables. Ensure .env file is set up for actual API calls for relevant endpoints.');
}

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/generate-from-keywords', async (req, res) => { // Make handler async
    const { keywords } = req.body;

    if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
        return res.status(400).json({ error: 'Keywords are required and must be a non-empty string.' });
    }

    if (!GEMINI_API_KEY) { // Check again, critical for this step
        console.error('Error: GEMINI_API_KEY is not defined for the API call.');
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // Placeholder: Replace with the actual Gemini API endpoint URL
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'; // Example for gemini-pro

    // Construct the prompt/payload for Gemini API
    const requestPayload = {
        contents: [{
            parts: [{
                text: `Based on the keywords "${keywords}", generate a highly descriptive and imaginative video prompt suitable for a text-to-video AI generator.
The prompt should vividly describe a scene, focusing on:
1. Visual Details: Specific colors, textures, objects, character appearances, and setting details.
2. Actions: What is happening, and how characters or elements are interacting.
3. Environment: The location, atmosphere, time of day, and weather.
4. Mood & Tone: The overall feeling or style (e.g., cinematic, epic, serene, mysterious, futuristic, etc. - infer from keywords if possible).
5. Camera Work (Optional but helpful): Suggest a camera angle, shot type, or movement if it enhances the vision.
Aim for a prompt that is 2-4 sentences long, forming a cohesive and inspiring paragraph.`
            }]
        }],
        // generationConfig: { // Consider uncommenting and adjusting if needed
        //   temperature: 0.8, // Slightly higher for more creativity
        //   maxOutputTokens: 300, // Adjust based on desired length
        // }
    };

    try {
        console.log(`Sending request to Gemini API with keywords: ${keywords}`);
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, // API key often sent as a query param
            requestPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        let generatedPrompt = 'Error: Could not parse prompt from Gemini response.'; // Default error
        if (response.data && response.data.candidates && response.data.candidates[0] &&
            response.data.candidates[0].content && response.data.candidates[0].content.parts &&
            response.data.candidates[0].content.parts[0]) {
            generatedPrompt = response.data.candidates[0].content.parts[0].text;
        } else {
            console.error('Error: Unexpected Gemini API response structure:', response.data);
        }

        console.log('Successfully received prompt from Gemini API.');
        res.json({ generated_prompt: generatedPrompt.trim() });

    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? JSON.stringify(error.response.data) : error.message); // Log more detail

        let specificDetail = 'The AI service returned an unexpected error.';
        if (error.response && error.response.data) {
            // Hypothetical: Adjust based on actual Gemini error structure
            if (error.response.data.error && error.response.data.error.message) {
                specificDetail = error.response.data.error.message;
            } else if (typeof error.response.data.message === 'string') { // Another common pattern
                specificDetail = error.response.data.message;
            } else if (typeof error.response.data === 'string' && error.response.data.length < 200) { // Short string might be an error message
                specificDetail = error.response.data;
            }
        } else if (error.request) {
            specificDetail = 'No response received from AI service. Check network or service status.';
        } else {
            specificDetail = error.message; // Error setting up the request
        }

        res.status(error.response ? error.response.status : 500).json({
            error: 'Failed to generate prompt with AI.', // Main user-facing error title
            detail: specificDetail // More specific detail for user / debugging
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 