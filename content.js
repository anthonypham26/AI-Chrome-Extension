// Prevents API from being called too frequently (debounce function)
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const getCompletion = async (message) => {
    console.log("🔹 Sending API Request:", message);
    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        console.log("🔹 API Response Received:", response.status);

        if (!response.ok) throw new Error("Failed to get completion");

        const data = await response.json();
        console.log("🔹 AI Response:", data.response);
        return data.response;
    } catch (error) {
        console.error("🚨 API Error:", error);
        return "";
    }
};


// Class for inline AI suggestion overlay
class SuggestionOverlay {
    constructor() {
        this.overlay = document.createElement("div");
        this.overlay.className = "ai-suggestion-overlay";
        this.overlay.style.cssText = `
            position: absolute;
            pointer-events: none;
            color: #9CA3AF;
            font-family: inherit;
            font-size: inherit;
            white-space: pre;
            z-index: 10000;
            background: transparent;
        `;
        document.body.appendChild(this.overlay);
    }

    // Show the AI suggestion at the correct position
    show(element, suggestion, cursorPosition) {
        if (!suggestion) {
            this.hide();
            return;
        }

        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        // Measure text width before the cursor position
        const measureSpan = document.createElement("span");
        measureSpan.style.cssText = `
            position: absolute;
            visibility: hidden;
            font-family: ${computedStyle.fontFamily};
            font-size: ${computedStyle.fontSize};
            letter-spacing: ${computedStyle.letterSpacing};
            white-space: pre;
        `;
        measureSpan.textContent = element.value.slice(0, cursorPosition);
        document.body.appendChild(measureSpan);
        const textWidth = measureSpan.getBoundingClientRect().width;
        document.body.removeChild(measureSpan);

        // Position the suggestion overlay next to cursor position
        this.overlay.style.top = `${rect.top + window.scrollY}px`;
        this.overlay.style.left = `${rect.left + window.scrollX + textWidth}px`;
        this.overlay.style.height = computedStyle.lineHeight;
        this.overlay.style.padding = computedStyle.padding;
        this.overlay.style.fontSize = computedStyle.fontSize;
        this.overlay.style.fontFamily = computedStyle.fontFamily;
        this.overlay.style.letterSpacing = computedStyle.letterSpacing;
        this.overlay.style.lineHeight = computedStyle.lineHeight;

        this.overlay.textContent = suggestion;
        this.overlay.style.display = "block";
    }

    hide() {
        this.overlay.style.display = "none";
    }
}

const suggestionOverlay = new SuggestionOverlay();

function attachAutoComplete(textarea) {
    if (textarea.dataset.aiEnhanced) return;
    textarea.dataset.aiEnhanced = "true";

    // Handle text input and debounce API call
    const handleInput = debounce(async (event) => {
        const userInput = event.target.value.trim();
        const cursorPos = event.target.selectionStart;
        const wordCount = userInput.split(/\s+/).filter(Boolean).length;

        if (wordCount < 5) {
            suggestionOverlay.hide();
            return;
        }

        const suggestion = await getCompletion(userInput);
        suggestionOverlay.show(event.target, suggestion, cursorPos);
    }, 500);

    textarea.addEventListener("input", handleInput);

    textarea.addEventListener("keydown", (event) => {
        if (event.key === "Tab" && suggestionOverlay.overlay.textContent) {
            event.preventDefault();
            const currentText = textarea.value;
            const caretPos = textarea.selectionStart;

            // Insert the AI suggestion at the cursor position
            const newText =
                currentText.substring(0, caretPos) +
                suggestionOverlay.overlay.textContent +
                currentText.substring(caretPos);
            textarea.value = newText;

            // Move cursor to the end of the inserted text
            textarea.selectionStart = textarea.selectionEnd =
                caretPos + suggestionOverlay.overlay.textContent.length;

            // Hide suggestion after insertion
            suggestionOverlay.hide();
        }
    });

    // Hide overlay on blur
    textarea.addEventListener("blur", () => suggestionOverlay.hide());
}

// Watch for new textareas dynamically
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === "TEXTAREA") {
                attachAutoComplete(node);
            }
        });
    });
});

console.log("🔹 AI Autocomplete Extension Loaded");

// dubug
const textareas = document.querySelectorAll("textarea");
console.log("Found textareas:", textareas.length);

// debug
textareas.forEach((textarea) => {
    textarea.addEventListener("input", (event) => {
        console.log("User typed:", event.target.value);
    });
});

observer.observe(document.body, { childList: true, subtree: true });

document.querySelectorAll("textarea").forEach(attachAutoComplete);
