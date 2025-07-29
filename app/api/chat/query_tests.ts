import axios from 'axios';
import readline from 'readline';
import OpenAI from 'openai';
import "dotenv/config"   

//import { OpenAIStream, StreamingTextResponse } from "ai"
import { streamText } from "ai";
import { openai } from '@ai-sdk/openai';


import { DataAPIClient } from "@datastax/astra-db-ts"


// Load environment variables
/*const {
    ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_API_URL,
    OPENAI_API_KEY
} = process.env
*/

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASTRA_API_URL = process.env.ASTRA_API_URL;
const ASTRA_API_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;

async function getEmbedding(input: string): Promise<number[]> {
  console.log(`📝 User query: "${input}"`);
  
  try {
    const response = await axios.post('https://api.openai.com/v1/embeddings', {
      input,
      model: 'text-embedding-3-small',
      encoding_format: "float"
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const embedding = response.data.data[0].embedding;
    console.log(`🔢 Embedding size: ${embedding.length}`);
    return embedding;
  } catch (err) {
    console.error(`❌ Embedding error: ${err.message}`);
    return [];
  }
}

async function searchDocuments(embedding: number[]) {
  try {
    const start = Date.now();
    
    const response = await axios.post(`${ASTRA_API_URL}/vector-search`, {
      vector: embedding,
      topK: 5
    }, {
      headers: {
        'X-Cassandra-Token': ASTRA_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Astra DB response status: ${response.status}`);
    console.log(`⏱ Query latency: ${Date.now() - start}ms`);

    const documents = response.data.documents;
    console.log(`🔍 Returned ${documents.length} results`);
    documents.forEach(doc => {
      console.log(`→ ${doc.document.title}`);
    });

  } catch (err) {
    console.error(`❌ Search error: ${err.message}`);
  }
}

(async () => {
  const input = process.argv[2]?.trim();
  if (!input) {
    console.error('⚠️ Please provide a query string as input');
    return;
  }

  const embedding = await getEmbedding(input);
  if (embedding.length) {
    searchDocuments(embedding);
  } else {
    console.warn('🚫 Skipping search due to invalid embedding');
  }
})();