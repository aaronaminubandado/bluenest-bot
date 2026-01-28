import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.OPENROUTER_API_KEY) {
	throw new Error("OPENROUTER_API_KEY environment variable is required");
}

const openrouter = new OpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Ask AI with business grounding
 */
export async function askAI({ userMessage, businessContext }) {
	try {
		const completion = await openrouter.chat.send({
			model: "openai/gpt-oss-120b:free",
			messages: [
				{
					role: "system",
					content: `
You are a customer support assistant for a real estate company.

Business context:
${businessContext}

Rules:
 - If the user intent suggests buying, renting, viewing, or scheduling, clearly say:
  "I can connect you with a BlueNest Realty agent to help with this."
- Do NOT ask for name or contact details directly
- Do NOT confirm appointments
- Let the system handle agent connection
- Answer concisely and professionally
- If unsure, suggest contacting a human agent
- Never invent prices, addresses, or legal advice
- Do NOT mention AI, models, or OpenRouter
`,
				},
				{
					role: "user",
					content: userMessage,
				},
			],
		});

		return (
			completion.choices[0]?.message?.content ||
			"I’m not sure about that. Would you like me to connect you with a human agent?"
		);
	} catch (error) {
		console.error("AI error:", error.message);
		throw error;
	}
}

const LEAD_TRIGGER_PHRASES = [
	"connect you with",
	"speak to an agent",
	"human agent",
	"our agent can help",
];

export function aiTriggersLead(aiResponse) {
	if (!aiResponse) return false;

	const text = aiResponse.toLowerCase();

	return LEAD_TRIGGER_PHRASES.some((phrase) => text.includes(phrase));
}
