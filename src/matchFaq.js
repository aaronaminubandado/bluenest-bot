import { faqs } from "./faqs.js";

export function matchFaq(message) {
  if (!message) return null;
  const text = message.toLowerCase();

  for (const faq of faqs) {
    for (const keyword of faq.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return faq.answer;
      }
    }
  }
  return null;
}
