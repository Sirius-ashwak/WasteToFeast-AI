import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// Ingredient shelf life data
const ingredientShelfLife = {
  tomatoes: { room: "5-7 days", refrigerated: "1-2 weeks", frozen: "6-8 months" },
  lettuce: { room: "1-2 days", refrigerated: "7-10 days", frozen: "Not recommended" },
  onions: { room: "2-3 months", refrigerated: "1-2 months", frozen: "8-12 months" },
  garlic: { room: "3-5 months", refrigerated: "1-2 months", frozen: "10-12 months" },
  ginger: { room: "1 week", refrigerated: "1 month", frozen: "6 months" },
  carrots: { room: "3-5 days", refrigerated: "2-3 weeks", frozen: "8-12 months" },
  potatoes: { room: "2-3 weeks", refrigerated: "3-4 months", frozen: "10-12 months" },
  mushrooms: { room: "2-3 days", refrigerated: "7-10 days", frozen: "8-12 months" },
  peppers: { room: "4-5 days", refrigerated: "1-2 weeks", frozen: "10-12 months" },
  celery: { room: "1-2 days", refrigerated: "1-2 weeks", frozen: "10-12 months" },
  herbs: { room: "2-3 days", refrigerated: "1-2 weeks", frozen: "6 months" },
  lemons: { room: "1 week", refrigerated: "2-3 weeks", frozen: "3-4 months" },
  limes: { room: "1 week", refrigerated: "2-3 weeks", frozen: "3-4 months" },
  apples: { room: "1-2 weeks", refrigerated: "4-6 weeks", frozen: "8 months" },
  sunflowerseeds: { room: "2-3 months", refrigerated: "4-6 months", frozen: "1 year" },
  quinoa: { room: "2-3 years", refrigerated: "3-4 years", frozen: "4-5 years" },
  driedapricots: { room: "6-12 months", refrigerated: "1-2 years", frozen: "1-2 years" },
  eggplants: { room: "2-3 days", refrigerated: "5-7 days", frozen: "6-8 months" },
  pumpkin: { room: "2-3 months", refrigerated: "3-4 months", frozen: "6-8 months" },
  smallredpeppers: { room: "1-2 weeks", refrigerated: "2-3 weeks", frozen: "6 months" },
  leeks: { room: "3-5 days", refrigerated: "1-2 weeks", frozen: "3-4 months" },
  brazilnuts: { room: "6-9 months", refrigerated: "9-12 months", frozen: "1-2 years" },
  beetroot: { room: "3-5 days", refrigerated: "2-3 weeks", frozen: "6-8 months" },
  cheese: { room: "2-4 hours", refrigerated: "1-4 weeks", frozen: "6-8 months" },
  flaxseeds: { room: "6-12 months", refrigerated: "1-2 years", frozen: "1-2 years" },
  mint: { room: "7-10 days", refrigerated: "2-3 weeks", frozen: "3-4 months" },
  rosemary: { room: "1-2 weeks", refrigerated: "2-3 weeks", frozen: "4-6 months" }
};

// Image analysis endpoint
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No image file provided'); // Debug log
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Received image:', req.file); // Debug log

    // Convert image buffer to base64
    const imageBase64 = req.file.buffer.toString('base64');

    // Initialize the model with gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt for ingredient detection
    const prompt = "List all the ingredients you can identify in this food image. Format them as a comma-separated list. Only include actual ingredients, not dishes or preparations.";

    // Generate content
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: imageBase64
            }
          }
        ]
      }]
    });

    const response = await result.response;
    const text = response.text();
    console.log('API Response:', text); // Debug log

    // Process the response to get ingredients with shelf life
    const ingredients = text
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(item => item.length > 0 && item !== ',')  // Filter out empty items and lone commas
      .map(ingredient => {
        // Clean the ingredient name
        const cleanName = ingredient
          .replace(/^[,\s]+|[,\s]+$/g, '')  // Remove leading/trailing commas and spaces
          .replace(/\s+/g, ' ');  // Normalize spaces

        return {
          name: cleanName,
          shelfLife: ingredientShelfLife[cleanName] || {
            room: "Varies",
            refrigerated: "Varies",
            frozen: "Varies"
          }
        };
      })
      .filter(item => item.name.length > 0);  // Final filter for any empty names

    console.log('Processed ingredients:', ingredients); // Debug log

    if (ingredients.length === 0) {
      console.log('No ingredients detected'); // Debug log
      throw new Error('No ingredients detected in the image');
    }

    res.json({ ingredients });

  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

// Add a root route handler
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Recipe generation endpoint in server/index.js
app.get('/recipeStream', async (req, res) => {
  try {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { ingredients, mealType, cuisine, cookingTime, complexity } = req.query;

    if (!ingredients || !mealType || !cuisine || !cookingTime || !complexity) {
      throw new Error('Please fill in all fields');
    }

    const prompt = `
      Generate a recipe using these ingredients: ${ingredients}. 
      Make it a ${complexity} ${mealType} in ${cuisine} cuisine 
      that takes ${cookingTime} to make.
      
      Format as:
      [Recipe Name]
      DETAILS:
      • Cuisine: ${cuisine}
      • Meal Type: ${mealType}
      • Cooking Time: ${cookingTime}
      • Complexity: ${complexity}
      INGREDIENTS:
      • [List ingredients]
      INSTRUCTIONS:
      1. [Step-by-step]
      COOKING TIPS:
      • [Tips]
      SERVINGS: [Number]
      CALORIES: [Per serving]
    `;

    // Initialize the model with streaming
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate content with streaming
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    // Stream the response
    for await (const chunk of result.stream()) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ 
        action: "chunk",
        chunk: chunkText 
      })}\n\n`);
    }

    // Signal end of stream
    res.write(`data: ${JSON.stringify({ action: "close" })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.write(`data: ${JSON.stringify({ 
      action: "error",
      error: error.message 
    })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});