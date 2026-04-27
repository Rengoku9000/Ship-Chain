import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid message" });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are ChainGuard AI, a premium logistics intelligence assistant embedded in a maritime supply-chain dashboard. " +
          "Help operators with shipment tracking, delay analysis, route optimization, warehouse capacity planning, and cost impact assessment. " +
          "Be concise, data-driven, and actionable. Use short paragraphs. When relevant, suggest specific next steps. " +
          "Never use markdown formatting — respond in plain text only.",
      },
      ...history.slice(-10),
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return res.status(200).json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "AI request failed" });
  }
}
