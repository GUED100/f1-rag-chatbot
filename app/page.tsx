"use client"
import Image from "next/image"
import f1GPTLogo from "./assets/F1GPT_logo.png"
import  { useChat} from "@ai-sdk/react"
import { Message } from "ai"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow"

//import { defaultTextSplitter } from "@langchain/core/messages"


const Home = () => {
    const { append, status, messages, input, handleInputChange, handleSubmit } = useChat()

    const noMessages = !messages || messages.length === 0

    const handlePrompt = ( { promptText }) =>{
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        console.log("📤 in handlePrompt: Prompt message created:", msg); // Debug output
        append(msg)
    }

    return (
        <main>
            <Image src={f1GPTLogo} width="250" height="100" priority alt="F1GPT Logo" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The Ultimate place for Formula One super fans!
                            Ask F1GPT anything about the fantastic topic of F1 racing
                            and it will come back with the most up-to-date answers.
                            We hope you enjoy!
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>                    

                ) : (
                    <>
                        {messages.map((message, index) => <Bubble key={`message-${index}`} message={message}/>)}
                        {status === "submitted" && <LoadingBubble/>}
                    </>
                )}
            </section>
                <form onSubmit={handleSubmit}>
                    <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me Something ..."/>
                    <input type="submit"/>

                </form>            
        </main>
    )
}

export default Home