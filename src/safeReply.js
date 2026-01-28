export async function safeReply(ctx, message) {
  try {
    await ctx.reply(message);
  } catch(error) {
    console.error("Failed to send message: ", {
      user: ctx.from?.id,
      error: error.message,
    });
  }
}
