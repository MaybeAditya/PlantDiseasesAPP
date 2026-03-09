// api/predict.js
// Vercel serverless function: expects POST JSON { imageBase64: "<base64-string>" }
// If GEMINI_API_KEY is present in process.env, you can plug in your Gemini call here.
// For safety this file DOES NOT contain any hard-coded key.

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { imageBase64 } = req.body || {};
  if (!imageBase64) {
    res.status(400).json({ error: "No imageBase64 provided" });
    return;
  }

  // If you set GEMINI_API_KEY in Vercel's Environment Variables, we attempt to call Gemini.
  const KEY = process.env.GEMINI_API_KEY;

  // SIMPLE MOCK RESPONSE (used when key is not set or for quick testing).
  const mockResponse = () => {
    const conf = Math.round(60 + Math.random() * 35);
    const preds = conf > 82 ? ["Early Blight","Late Blight","Powdery Mildew"] : ["Healthy","Nutrient Deficiency"];
    const prediction = preds[Math.floor(Math.random()*preds.length)];
    return {
      prediction,
      confidence: String(conf),
      summary: prediction === "Healthy" ? "Leaf looks healthy." : `${prediction} observed — small lesions and discoloration.`,
      recommendations: prediction === "Healthy" ? ["Keep monitoring","Maintain watering"] : ["Remove infected leaves","Apply recommended treatment","Avoid overhead watering"]
    };
  };

  if (!KEY) {
    // No key set — return mock data so frontend demo works immediately.
    res.status(200).json(mockResponse());
    return;
  }

  // ======= PLACEHOLDER: call Gemini here =======
  // NOTE: The exact request shape depends on the Google Generative AI SDK or REST API.
  // If you want, I can add the exact network call once you confirm which Gemini endpoint/version you are using
  // and whether you prefer the official @google/generative-ai Node SDK or a raw HTTPS approach.
  //
  // For now, to keep this function safe and avoid shipping keys in the repo, we'll:
  // 1. Accept the imageBase64
  // 2. (Optional) call your Gemini model here using your KEY
  // 3. For this template, we still return mockResponse()
  //
  // Replace the block below with the real Gemini call.

  try {
    // TODO: Replace with real Gemini invocation.
    // Example placeholder: call your model here and parse JSON response.
    // const aiResult = await callGemini(KEY, imageBase64);
    // res.json(aiResult);

    // For now:
    res.status(200).json(mockResponse());
  } catch (err) {
    console.error("Predict error:", err);
    res.status(500).json({ error: "Server error while calling AI" });
  }
};