import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image" });
    }

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Answer the trivia question in this image. " +
                "Return ONLY the final answer. No explanation.",
            },
            {
              type: "input_image",
              image_url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
              detail: "low",
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      answer: response.output_text?.trim?.() || "",
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed",
    });
  }
}