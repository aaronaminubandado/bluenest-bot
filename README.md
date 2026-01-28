# BlueNestBot

BlueNestBot is a Telegram chatbot built for a real estate agency. It helps users get information about buying and renting properties, schedule property viewings, and connect with a human agent when needed.

The bot is designed to demonstrate chatbot architecture, conversational flows, lead capture, and AI-assisted responses using modern Node.js tooling.

## What the bot does

BlueNestBot acts as the first point of contact for a real estate business.

It can:
- Respond to greetings and common conversational messages
- Answer frequently asked questions about buying, renting, office hours, and services
- Capture leads by collecting name, contact details, and intent
- Escalate conversations to a human agent when appropriate
- Use an AI model as a fallback when no predefined response applies
- Provide admin-only commands for viewing leads and basic bot statistics

## How it works

The bot is built using the Telegraf framework for Telegram bots.

Incoming messages are processed in the following order:
1. Commands such as `/help` or `/contact`
2. Active lead capture sessions
3. Common replies like greetings or thanks
4. FAQ matching using predefined rules
5. Escalation triggers for human assistance
6. AI fallback using business context for safe, relevant replies

This layered approach ensures predictable behavior and avoids unnecessary AI usage.

## Business context

The bot is configured with a structured business context that defines:
- Company name and description
- Services offered
- Service area
- Office hours
- Tone and escalation policy

This context is injected into AI requests so responses stay aligned with the business.

## Admin features

Admin-only commands are supported:
- `/leads` to view captured leads
- `/stats` to view basic bot statistics

Admin access is determined securely without hardcoding sensitive identifiers in public code.

## Technology stack

- Node.js
- Telegraf
- OpenRouter compatible AI models
- Environment based configuration
- Deployed as a long-running service

## Purpose

This project demonstrates:
- Real world chatbot design
- Safe AI integration
- State management for conversational flows
- Lead capture logic
- Deployment ready backend structure

It is intended for portfolio use and can be adapted for other service based businesses.

## Running the bot

1. Clone the repository
2. Install dependencies
3. Create a `.env` file with your Telegram bot token and AI API key
4. Start the bot using Node.js

## Deployment

The bot can be deployed on platforms like Render or similar Node.js hosting providers using environment variables for configuration.

---

BlueNestBot is a practical example of combining rule based logic with AI assistance to build a reliable and business focused chatbot.
