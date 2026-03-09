import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // 1. Reject anything that isn't a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // 2. Grab the API key securely from Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: Missing GEMINI_API_KEY environment variable.");
      return res.status(500).json({ error: 'Server misconfiguration.' });
    }

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 4. Force strict JSON output
    const prompt = `Analyze this leaf image for diseases. 
    Return ONLY a raw, valid JSON object with absolutely no markdown formatting, no backticks, and no extra text.
    Use this exact structure:
    {
      "prediction": "Disease Name or Healthy",
      "confidence": 95,
      "summary": "Short explanation",
      "recommendations": ["Tip 1", "Tip 2"]
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } } 
    ]);

    const responseText = result.response.text();
    
    // 5. Clean and parse the response
    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);

    // 6. Send the clean data back to your frontend
    return res.status(200).json(data);

  }  catch (error) {
    console.error("Backend Error:", error);
    // Send the actual error message back to the frontend so we can see it
    return res.status(500).json({ 
      error: 'Failed to process image', 
      details: error.message || error.toString() 
    });
  }
}