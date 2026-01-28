export function startLeadCapture(message) {
  if (!message || typeof message !== "string") {
    return false;
  }
  const text = message.toLowerCase();
  
  return (
    text.includes("agents") ||
    text.includes("contact") ||
    text.includes("viewing") ||
    text.includes("visit") ||
    text.includes("buy") ||
    text.includes("rent")
  );
}
