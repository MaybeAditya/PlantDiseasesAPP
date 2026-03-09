import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'No image provided' });

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Strict prompt to ensure we get parsable JSON back
    const prompt = `Analyze this leaf image for diseases. Return ONLY a raw JSON object with this exact structure: {"prediction": "Disease Name or Healthy", "confidence": 95, "summary": "Short explanation", "recommendations": ["Tip 1", "Tip 2"]}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } } 
    ]);

    const responseText = result.response.text();
    
    // Clean up any markdown formatting Gemini might add
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    res.status(200).json(data);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}