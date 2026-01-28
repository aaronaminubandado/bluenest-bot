
export function shouldEscalateToHuman(message) {
  if (!message) {
    return false;
  }
  const text = message.toLowerCase();
  const escalationPattern = /\b(agent|human|person|call|contact|speak to)\b/;

  return escalationPattern.test(text);
}
    