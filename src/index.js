import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { matchFaq } from "./matchFaq.js";
import { sessions } from "./sessions.js";
import { leads } from "./leads.js";
import { startLeadCapture } from "./leadTriggers.js";
import { safeReply } from "./safeReply.js";
import { askAI } from "./aiClient.js";
import { businessContext } from "./businessContext.js";
import { shouldEscalateToHuman } from "./escalation.js";
import { matchCommonReply } from "./commonReplies.js";
import { isAdmin } from "./admin.js";

dotenv.config();

if (!process.env.BOT_TOKEN) {
	throw new Error("BOT_TOKEN environment variable is required");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

/* ───────────────────── START ───────────────────── */

bot.start((ctx) => {
	return safeReply(
		ctx,
		"🏡 Welcome to BlueNest Realty!\n\n" +
			"I can help with buying, renting, and property viewings.\n\n" +
			"Type /help to see what I can do.",
	);
});

/* ───────────────────── COMMANDS ───────────────────── */

bot.command("help", (ctx) =>
	safeReply(
		ctx,
		`BlueNest Realty Bot Help

You can:
• Ask about buying or renting
• Schedule property viewings
• Request a human agent

Commands:
/contact – Speak with an agent
/help – Show this message`,
	),
);

bot.command("contact", (ctx) => {
	sessions[ctx.from.id] = { step: "name", lead: {} };
	return safeReply(ctx, "Sure! May I have your name?");
});

bot.command("leads", (ctx) => {
	if (!isAdmin(ctx)) {
		return ctx.reply("This command is restricted to administrators.");
	}

	if (leads.length === 0) {
		return ctx.reply("No leads captured yet.");
	}

	const formatted = leads
		.map(
			(l, i) =>
				`${i + 1}. ${l.name}\nContact: ${l.contact}\nIntent: ${l.intent}\n`,
		)
		.join("\n");

	ctx.reply(`Captured Leads:\n\n${formatted}`);
});

bot.command("stats", (ctx) => {
	if (!isAdmin(ctx)) {
		return ctx.reply("This command is for admins only.");
	}

	ctx.reply(
		`Bot Stats\n\nLeads captured: ${leads.length}\nActive sessions: ${Object.keys(sessions).length}`,
	);
});

/* ───────────────────── TEXT HANDLER ───────────────────── */

bot.on("text", async (ctx) => {
	const userId = ctx.from.id;
	const text = ctx.message.text.trim();

	try {
		/* Ignore commands (they are handled elsewhere) */
		if (text.startsWith("/")) return;

		/* ACTIVE LEAD SESSION */
		if (sessions[userId]) {
			const session = sessions[userId];
			session.lead ??= {};

			if (session.step === "name") {
				session.lead.name = text;
				session.step = "contact";
				return safeReply(
					ctx,
					"Thanks! How can we contact you? (phone or email)",
				);
			}

			if (session.step === "contact") {
				session.lead.contact = text;
				session.step = "intent";
				return safeReply(ctx, "Are you looking to buy or rent?");
			}

			if (session.step === "intent") {
				session.lead.intent = text;
				session.lead.timestamp = Date.now();

				leads.push(session.lead);
				delete sessions[userId];

				return safeReply(
					ctx,
					"Thanks! Your details have been sent to a BlueNest agent.",
				);
			}

			delete sessions[userId];
			return safeReply(ctx, "Let’s start again — how can I help?");
		}

		/* COMMON REPLIES (hi, hello, thanks, etc.) */
		const commonReply = matchCommonReply(text);
		if (commonReply) {
			return safeReply(ctx, commonReply);
		}

		/* FAQ MATCH */
		const faqAnswer = matchFaq(text);
		if (faqAnswer) {
			await safeReply(ctx, faqAnswer);

			if (startLeadCapture(text)) {
				sessions[userId] = { step: "name", lead: {} };
				return safeReply(
					ctx,
					"Would you like to speak with an agent? If so, may I have your name?",
				);
			}

			return;
		}

		/* EXPLICIT ESCALATION */
		if (shouldEscalateToHuman(text)) {
			sessions[userId] = { step: "name", lead: {} };
			return safeReply(
				ctx,
				"I can connect you with a human agent. May I have your name?",
			);
		}

		/* AI FALLBACK (last resort only) */
		if (text.length < 5) {
			return safeReply(ctx, "Could you please tell me a bit more?");
		}

		const aiResponse = await askAI({
			userMessage: text,
			businessContext,
		});

		await safeReply(ctx, aiResponse);

		await safeReply(
			ctx,
			"If you’d like, I can connect you with a human agent.",
		);
	} catch (error) {
		console.error("Bot error:", error);
		await safeReply(ctx, "Something went wrong. Please try again later.");
	}
});

/* ───────────────────── LIFECYCLE ───────────────────── */

bot.launch()
	.then(() => console.log("BlueNest Realty bot is running"))
	.catch((err) => {
		console.error("Failed to launch bot:", err);
		process.exit(1);
	});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
