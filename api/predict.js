import { GoogleGenerativeAI } from "@google/generative-ai"

export default async function handler(req,res){

if(req.method!=="POST"){
return res.status(405).json({error:"Method not allowed"})
}

const { image } = req.body

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
model:"gemini-1.5-flash"
})

const prompt = `
You are a plant disease expert.

Analyze the leaf image.

Return JSON ONLY:

{
"prediction":"",
"confidence":number,
"summary":"",
"recommendations":[]
}
`

const result = await model.generateContent([
prompt,
{
inlineData:{
data:image,
mimeType:"image/jpeg"
}
}
])

let text = result.response.text()

text = text.replace(/```json|```/g,"")

const json = JSON.parse(text)

res.status(200).json(json)

}