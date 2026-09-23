document.addEventListener('DOMContentLoaded', function() {

    // DOM Elements
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Initialize the chat
    initChat();
    
    function initChat() {
        // Load previous messages
        loadMessages();
        
        // Set up event listeners
        setupEventListeners();
        
        // Send welcome message if it's a new chat
        if (chatMessages.children.length === 0) {
            setTimeout(() => {
                sendWelcomeMessage();
            }, 500);
        }
    }
    
    function setupEventListeners() {
        // Send message when button is clicked
        sendButton.addEventListener('click', handleSendMessage);
        
        // Send message when Enter key is pressed
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
        
        // Back button functionality
        document.querySelector('.back-button').addEventListener('click', function() {
            if (confirm('Return to RIT website?')) {
                window.location.href = 'https://www.ritchennai.org';
            }
        });
          
        // Attachment button functionality
        document.querySelector('.attachment-button').addEventListener('click', function() {
            alert('Document upload feature would appear here');
        });
        
        // Profile button functionality
        document.getElementById('profileBtn').addEventListener('click', function() {
            window.location.href = '/admin';
        });
        
        // Focus input when clicking on chat
        chatMessages.addEventListener('click', function() {
            messageInput.focus();
        });
    }
    
    function handleSendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText) return;
        
        // Add user message to chat
        addMessage(messageText, 'user');
        messageInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Process the message and generate response
        setTimeout(() => {
            processUserMessage(messageText);
        }, 500);
    }
    
    async function processUserMessage(messageText) {
        try {
            // First try to get answer from MySQL database
            const dbResponse = await fetchAnswerFromDatabase(messageText);
            
            if (dbResponse) {
                // If found in database, use that answer
                addMessage(dbResponse, 'ai');
                saveMessages();
                
                // Add relevant follow-up suggestions
                setTimeout(() => {
                    addSuggestionsBasedOnContext(messageText);
                }, 300);
            } else {
                // If not found in database, use default responses
                const defaultResponse = generateDefaultResponse(messageText);
                addMessage(defaultResponse.text, 'ai');
                saveMessages();
                
                if (defaultResponse.showSuggestions) {
                    setTimeout(() => {
                        addSuggestionsBasedOnContext(messageText);
                    }, 300);
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            addMessage("I'm having trouble connecting to our database. Please try again later.", 'ai');
        } finally {
            hideTypingIndicator();
        }
    }
    
    async function fetchAnswerFromDatabase(question) {
    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: question })
        });
        if (response.ok) {
            const data = await response.json();
            return data.response;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Database query error:', error);
        return null;
    }
}

   /* async function fetchAnswerFromDatabase(question) {
        // In a real implementation, this would call your backend API
        // which would query the MySQL database
        try {
            // This is a simulation - replace with actual API call
            const response = await simulateDatabaseQuery(question);
            return response;
        } catch (error) {
            console.error('Database query error:', error);
            return null;
        }
    } */
    
 /*   function simulateDatabaseQuery(question) {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(() => {
                // This is where you would match the question against your database
                // For now, we'll use a simple simulation
                
                // Sample database responses (in real app, these would come from MySQL)
                const knowledgeBase = {
                    "deadline": "The application deadline for Fall 2024 is January 15, 2024. Early decision deadline is November 1, 2023.",
                    "requirements": "Undergraduate applicants need: 1. Completed application 2. Official transcripts 3. SAT/ACT scores (optional) 4. 2 recommendation letters 5. Personal essay",
                    "fee": "The application fee is $65, but fee waivers are available for eligible students.",
                    "international": "International students need additional documents: 1. TOEFL/IELTS scores 2. Financial documentation 3. Passport copy",
                    "tour": "Campus tours are available Monday-Friday at 10am and 2pm. You can schedule online at rit.edu/visit",
                    "programs": "RIT offers programs in: 1. Engineering 2. Computing 3. Business 4. Art & Design 5. Science 6. Liberal Arts"
                };
                
                // Simple keyword matching (in real app, use more sophisticated NLP)
                const lowerQuestion = question.toLowerCase();
                let bestMatch = null;
                let bestScore = 0;
                
                for (const [keyword, answer] of Object.entries(knowledgeBase)) {
                    const score = calculateMatchScore(lowerQuestion, keyword);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = answer;
                    }
                }
                
                // Only return answer if we have a good match
                resolve(bestScore > 0.5 ? bestMatch : null);
            }, 800); // Simulate network delay
        });
    } */
    
   /* function calculateMatchScore(question, keyword) {
        // Simple scoring algorithm - in real app use more sophisticated NLP
        if (question.includes(keyword)) return 1.0;
        if (question.includes(keyword.slice(0, -1))) return 0.8; // Match plural/singular
        if (question.split(/\s+/).some(word => word.startsWith(keyword.slice(0, 3)))) return 0.6; // Match beginning of word
        return 0;
    }*/
    
    function generateDefaultResponse(messageText) {
        const lowerInput = messageText.toLowerCase();
        let responseText = '';
        let showSuggestions = true;
        
        // Greetings
        if (/(hi|hello|hey)/i.test(lowerInput)) {
            responseText = "Hello! I'm the RIT Admissions Assistant. How can I help you today?";
        } 
        // Thanks
        else if (/(thank|thanks|appreciate)/i.test(lowerInput)) {
            responseText = "You're welcome! Let me know if you have any other questions about RIT.";
            showSuggestions = false;
        }
        // Default
        else {
            responseText = "I'm not sure I understand. Could you rephrase your question or try one of these common topics?";
        }
        
        return {
            text: responseText,
            showSuggestions: showSuggestions
        };
    }
    
    function addSuggestionsBasedOnContext(context) {
        const lowerContext = context.toLowerCase();
        let suggestions = [];
        
        // Determine which suggestions to show based on context
        if (/(deadline|date|when)/i.test(lowerContext)) {
            suggestions = [
                "What are the library hours?",
                "when is the last date to pay fees?",
                "How long does it take for the semester results to be announced?"
            ];
        } 
        else if (/(requirement|document|need)/i.test(lowerContext)) {
            suggestions = [
                "Are there any fines for overdue books?",
                "how can I pay tuition online?",
                "what is the minimum attendance requirement?"
            ];
        }
        else if (/(program|major|study|degree)/i.test(lowerContext)) {
            suggestions = [
                "How many internal and external exams are there per semester?",
                "Are there scholarships I can apply for during the year?",
                "Art and design programs"
            ];
        }
        else {
            // Default suggestions
            suggestions = [
                "how can I get my ID card reissued?",
                "how do I update my contact number in records?",
                "can I pay my fees in installments?"
            ];
        }
        
        // Create and add suggestion chips
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'message ai-message';
        
        suggestionDiv.innerHTML = `
            <div class="message-avatar">
                <div class="logo-avatar">R</div>
            </div>
            <div class="message-content">
                <p>You might want to ask:</p>
                <div class="suggestion-chips">
                    ${suggestions.map(s => `<div class="suggestion-chip">${s}</div>`).join('')}
                </div>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        `;
        
        chatMessages.appendChild(suggestionDiv);
        
        // Add click handlers to suggestion chips
        suggestionDiv.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                messageInput.value = this.textContent;
                messageInput.focus();
            });
        });
        
        scrollToBottom();
        saveMessages();
    }
    
    function sendWelcomeMessage() {
        addMessage("Welcome to the RIT CampusConnect!", 'ai');
        
        setTimeout(() => {
            addMessage(`I'm here to help you with queries regarding:<br><br>
                • Admissions<br>
                • Transport<br>
                • Hostel<br>
                • Academics<br><br>
                What would you like to know about RIT?
            `, 'ai');
            
            setTimeout(() => {
                addSuggestionsBasedOnContext('welcome');
            }, 500);
        }, 800);
    }
    
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        messageDiv.innerHTML = sender === 'ai' ? `
            <div class="message-avatar">
                <div class="logo-avatar">R</div>
            </div>
            <div class="message-content">
                ${text}
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        ` : `
            <div class="message-content">
                <p>${text}</p>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function showTypingIndicator() {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }
    
    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }
    
    function saveMessages() {
        const messages = [];
        document.querySelectorAll('.message').forEach(msg => {
            const isAI = msg.classList.contains('ai-message');
            const content = msg.querySelector('.message-content').innerHTML;
            const time = msg.querySelector('.message-time').textContent;
            
            messages.push({
                isAI: isAI,
                text: content,
                time: time
            });
        });
        
        localStorage.setItem('CampusConnect', JSON.stringify(messages));
    }
    
    function loadMessages() {
        const savedMessages = localStorage.getItem('CampusConnect');
        if (savedMessages) {
            const messages = JSON.parse(savedMessages);
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.isAI ? 'ai-message' : 'user-message'}`;
                messageDiv.innerHTML = msg.isAI ? `
                    <div class="message-avatar">
                        <div class="logo-avatar">R</div>
                    </div>
                    <div class="message-content">
                        ${msg.text}
                    </div>
                ` : `
                    <div class="message-content">
                        ${msg.text}
                    </div>
                `;
                chatMessages.appendChild(messageDiv);
            });
            scrollToBottom();
        }
    }
});
// Clear chat history on page refresh
localStorage.removeItem('CampusConnect');
