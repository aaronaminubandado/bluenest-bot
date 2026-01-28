import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { matchFaq } from "./matchFaq.js";
import { sessions } from "./sessions.js";
import { leads } from "./leads.js";
import { startLeadCapture } from "./leadTriggers.js";
import { safeReply } from "./safeReply.js";
import { askAI, aiTriggersLead } from "./aiClient.js";
import { businessContext } from "./businessContext.js";
import { shouldEscalateToHuman } from "./escalation.js";
import { matchCommonReply } from "./commonReplies.js";
import { isAdmin } from "./admin.js";

dotenv.config();

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN environment variable is required");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    "🏡 Welcome to BlueNest Realty!\n\n" +
      "I can help with buying, renting, and property viewings.\n\n" +
      "Type /help to see what I can do.",
  );
});

bot.on("text", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    const commonReply = matchCommonReply(text);
    if (commonReply) {
      return safeReply(ctx, commonReply);
    }

    const faqAnswer = matchFaq(text);

    if (sessions[userId]) {
      const session = sessions[userId];

      if (!session.lead) {
        session.lead = {};
      }

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

      // Fallback for invalid session state
      delete sessions[userId];
      return safeReply(
        ctx,
        "Something went wrong. Let’s start again, how can I help you?",
      );
    }

    if (faqAnswer) {
      await safeReply(ctx, faqAnswer);

      if (startLeadCapture(text)) {
        sessions[userId] = { step: "name", lead: {} };
        await safeReply(ctx, "May I have your name so an agent can assist you?");
      }
      return;
    }

    if (shouldEscalateToHuman(text)) {
      sessions[userId] = { step: "name", lead: {} };
      return safeReply(
        ctx,
        "I can connect you with a human agent. May I have your name?",
      );
    }

    try {
      const aiResponse = await askAI({
        userMessage: text,
        businessContext,
      });

      await safeReply(ctx, aiResponse);
      if (aiTriggersLead(aiResponse)) {
        sessions[userId] = { step: "name", lead: {} };
        return safeReply(
          ctx,
          "I can connect you with an agent. May I have your name?",
        );
      }
    } catch (error) {
      console.error("AI fallback failed:", error.message);

      return safeReply(
        ctx,
        "I’m having trouble answering that right now. Would you like me to connect you with a human agent?",
      );
    }
  } catch (error) {
    console.error("Unexpected bot error: ", error);
    await safeReply(ctx, "Something went wrong. Please try again later.");
  }
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
    return ctx.reply("This command is for admins only");
  }

  ctx.reply(
    `Bot Stats\n\nLeads captured: ${leads.length}\nActive sessions: ${Object.keys(sessions).length}`,
  );
});

bot.command("help", (ctx) => {
  return safeReply(
    ctx,
    `BlueNest Realty Bot Help
	
	You can:
	• Ask questions about buying or renting
	• Ask about property viewings
	• Request a human agent
	
	Commands:
	/contact – Speak with an agent
	/help – Show this message`,
  );
});

bot.command("contact", (ctx) => {
  const userId = ctx.from.id;

  sessions[userId] = { step: "name", lead: {} };

  return safeReply(ctx, "Sure! May I have your name so an agent can assist you?");
});

bot.launch().catch((err) => {
  console.error("Failed to launch bot:", err);
  process.exit(1);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("BlueNest Realty bot is running");
