// Import required libraries and modules
import { DataAPIClient } from "@datastax/astra-db-ts"                 // Astra DB client for database operations
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer" // Loads web content via Puppeteer
import OpenAI from "openai"                                           // OpenAI SDK for embeddings

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters" // Splits long text into manageable chunks
import "dotenv/config"                                                // Loads environment variables from a .env file

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"        // Supported vector similarity metrics

// Load environment variables
const {
    ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

// Instantiate OpenAI client with API key
const openai_client = new OpenAI({ apiKey: OPENAI_API_KEY })

// Define URLs to scrape Formula 1 content from
const f1Data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://www.formula1.com/en/latest?page=1',
    'https://www.newsnow.co.uk/h/Sport/F1',    'https://www.cbssports.com/motor-sports/news/2025-belgian-grand-prix-picks-odds-grid-start-time-formula-1-predictions-best-bets-by-proven-model/',
    'https://www.formula1.com/en/latest/all',    'https://www.skysports.com/f1/live-blog/12433/12466779/f1-news-rumours-and-gossip-formula-1-latest-updates-on-teams-driver-transfer-market-and-contracts?postid=9921945',
    'https://slicksandsticks.com/2025/07/17/connor-zilisch-formula-1-aspirations/',
    'https://www.skysports.com/f1/news/12433/13061245/lewis-hamilton-to-join-ferrari-for-2025-formula-1-season',
    'https://www.sportbible.com/f1/highest-paid-f1-drivers-lewis-hamilton-max-verstappen-035043-20240920',
    'https://racingnews365.com/f1-2025',
    'https://www.crash.net/f1/live/1043667/2025-f1-belgian-grand-prix-race-day-live-updates',   
    'https://www.skysports.com/f1/standings',
    'https://www.racetrackmasters.com/belgian-gp-2025-f1-championship-standings/',
    'https://www.planetf1.com/news/f1-live-2025-belgian-gp-race-updates',
    'https://www.formula1.com/en/racing/2024/',
    'https://www.formula1.com/en/racing/2025/'
]

// Connect to Astra DB
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })

// Initialize a text splitter to create chunks suitable for embedding
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,        // Max size per chunk
    chunkOverlap: 100      // Overlap between adjacent chunks for better context
})

// Create a new collection in Astra DB with vector search enabled
const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,         // Must match the embedding size of OpenAI's model
            metric: similarityMetric
        }
    })
    console.log(res)
}

// Load and process web data, then store chunks and embeddings into the database
const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)

    let url = ""; // Declare url here for broader scope

    try {
        for await (const url of f1Data) {

            console.log(`🔎 Attempting: ${url} !!!!`);

            const content = await scrapePage(url)                  // Scrape page content           

            const chunks = await splitter.splitText(content)       // Break content into chunks

            for await (const chunk of chunks) {
                const embedding = await openai_client.embeddings.create({  // Generate embedding for each chunk
                    model: "text-embedding-3-small",
                    input: chunk,
                    encoding_format: "float"
                })

                const vector = embedding.data[0].embedding         // Extract raw embedding

                // Insert embedding and original chunk into database
                const res = await collection.insertOne({
                    $vector: vector,
                    text: chunk
                })
                
                console.log("✅ Inserted:", res);

            }
        }
        
    } catch (error){
        console.error(`❌ Error processing ${url}:`, error.message);
    }
}

// Scrapes raw HTML from the page and removes tags for cleaner processing
const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true      // Run browser in background
        },
        gotoOptions: {
            waitUntil: "domcontentloaded" // Wait for page DOM to load before scraping
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    
    const raw = await loader.scrape()
    return typeof raw === 'string' 
        ? raw.replace(/<[^>]*>?/gm, '')  // Strip HTML tags
        : ''
}

// Kick off the process: create the collection, then ingest data
createCollection().then(() => loadSampleData())
