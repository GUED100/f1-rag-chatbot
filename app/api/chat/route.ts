import OpenAI from "openai";

//import { OpenAIStream, StreamingTextResponse } from "ai"
import { streamText } from "ai";
import { openai } from '@ai-sdk/openai';


import { DataAPIClient } from "@datastax/astra-db-ts"

/*{
  "messages": [
    { "role": "user", "content": "Hey!" },
    { "role": "assistant", "content": "Hello there" },
    { "role": "user", "content": "What's the weather like?" }
  ]
}*/


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


// Connect to Astra DB
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })

export async function POST(req: Request) {
    try {
        const messages = await req.json()
        console.log("Parsed request body:", messages);
        console.log(Array.isArray(messages.messages)); // Should log true
        
        console.log("messages.messages:",  messages.messages);

        //const latestMessage = messages[messages?.length - 1]?.content
        const latestMessage = messages.messages?.[messages.messages.length - 1]?.content;


        console.log("Latest message content:", latestMessage); 
        

        let docContext = ""

        /*if (!Array.isArray(messages) || messages.length === 0) {
            console.error("No messages found in request body");
        } else {

            console.log("Latest message content:", latestMessage);        
        }*/
        const embedding = await openai_client.embeddings.create({
                model: "text-embedding-3-small",
                input: latestMessage,
                encoding_format: "float"
        })
        if (!embedding) {
            console.error("Embedding generation failed.");
            docContext = "";
        }            
        try {
            const collection = db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding.data[0].embedding,
                },
                limit: 10
            })

            const documents = await cursor.toArray()

            const docsMap = documents?.map(doc => doc.text)

            docContext = JSON.stringify(docsMap)

            console.log("docContext:",  docContext);

        }
        catch (err) {
            console.log("Error querying db ...")
            docContext = ""
        }

        const template = {
            role: "system",
            content: `You are an AI assistant who knows everything about Formula One.
            Use the below context to augment what you know about Formula One racing.
            The context will provide you with the most recent page data from wikipedia, 
            the official F1 website and others.
            If the context doesn't include the information  you need then answer based 
            on your exsting knowledge and don't mention the source of your information nor 
            what the context does or doesn't include.
            Format responses using markdown where applicable and don't return images.
            ---------------
            START CONTEXT
            ${docContext}
            END CONTEXT
            ---------------
            QUESTION: ${latestMessage}      
            ---------------  
        `
        }
        const response = await streamText({
        model: openai("gpt-4o-mini", ),
        messages: [template, ...messages.messages],
        toolChoice: "auto", // or "none", "required", etc.
        
        });

        // Respond with the streamed text
        console.log(22222, response.toDataStreamResponse());
        return response.toDataStreamResponse();        
/*
        const response = await openai_client.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            messages: [template, ...messages] 
        })

        const stream= OpenAIStream(response)
        return new StreamingTextResponse (stream)
*/
    } catch (err) {
        throw err
    }
}