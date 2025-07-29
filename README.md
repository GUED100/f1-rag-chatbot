# 🏎️ Formula 1 Chatbot — Real-Time News & Semantic Search

Your personal AI assistant for everything Formula 1. This project uses cutting-edge tech to scrape, embed, and query F1 news so fans can chat about the latest updates with style and speed.

---

## 🚀 Features

- 🔍 Context-aware responses with real-time F1 news
- 🧠 OpenAI embeddings + GPT-4o-mini for smart replies
- 🗂️ Vector search using Astra DB
- 🌐 Web scraping via Puppeteer for fresh data
- 💬 Streaming chat responses for smooth UX

---

## 🛠️ Stack & Dependencies

| Tech/Library                | Purpose                                       |
|----------------------------|-----------------------------------------------|
| `LangChain`                | Web content loading & text splitting          |
| `OpenAI SDK`               | Embedding generation and chat responses       |
| `Datastax Astra DB`        | Storing and searching vector embeddings       |
| `ai-sdk` + `streamText()`  | OpenAI streaming integration                  |
| `TypeScript` + `Node.js`   | App logic and type safety                     |
| `Puppeteer`                | Scraping F1 content from various sources      |
| `dotenv`                   | Secure secrets management                     |

---

## Usage
- Make sure to have an account to https://astra.datastax.com. 
- Create a .env file and provide the info for: ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY
- Make sure the npm dependencies modules are properly install (See package.json)
- 1) run "npm run seed" to create the collection, then ingest data (see scripts\loadDb.ts)
     Feel free to extend the list of F1 sites to consider to the DB creation.
- 2) run "npm run dev" to run the Front-end and perform the queries tasks.

