export function matchCommonReply(text) {
  const msg = text.toLowerCase();

  // Greetings
  if (/(^|\s)(hi|hello|hey|yo)(\s|$)/.test(msg)) {
    return "Hi there! 👋 How can I help you today at BlueNest Realty?";
  }

  // Time-based greetings
  if (/(good morning|good afternoon|good evening)/.test(msg)) {
    return "Hello! Hope you're having a great day 😊 How can I assist you with property questions?";
  }

  // Thanks
  if (/(thanks|thank you|thx)/.test(msg)) {
    return "You’re very welcome! Let me know if you need help with anything else.";
  }

  // Goodbye
  if (/(bye|goodbye|see you|later)/.test(msg)) {
    return "Goodbye! 👋 If you need property help later, I’ll be right here.";
  }

  return null;
}
