import { index } from "langchain/indexes"
import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionsRow = ({ onPromptClick }) => {
    const prompts = [
        "Who is head of racing for Aston Martin's F1 Academy team?",
        "Who is the highest paid F1 driver?",
        "Who will be the newest driver for Ferrari?",
        "Who is the current Formula One World Driver's Champion?",
        "When F1 rejected Andretti?",
        "Can you list all 2024 and 2025 race winners with the corresponding races?"
    ]
    
    return (   
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) => (
                <PromptSuggestionButton
                    key={`suggestion-${index}`}
                    text={prompt}
                    //onClick={() => onPromptClick(prompt)}
                    onClick={() => onPromptClick({ promptText: prompt })} // ✅ passing an object

                />
            ))}
        </div>
    )
}

export default PromptSuggestionsRow