const socket = io();

// DOM Elements
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatForm = document.getElementById('chat-form');
const messagesContainer = document.getElementById('messages');
const chatBox = document.getElementById('chat-box');
const userCountEl = document.getElementById('user-count');
const typingIndicator = document.getElementById('typing-indicator');

let currentUsername = '';
let typingTimeout = null;

// Theme Initialization
const savedTheme = localStorage.getItem('aurora-theme') || 'dark';
if (savedTheme === 'light') {
    body.classList.replace('dark-mode', 'light-mode');
    themeIcon.classList.replace('fa-sun', 'fa-moon');
}

themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-mode')) {
        body.classList.replace('dark-mode', 'light-mode');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('aurora-theme', 'light');
    } else {
        body.classList.replace('light-mode', 'dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('aurora-theme', 'dark');
    }
});

// Join Logic
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

function joinChat() {
    const val = usernameInput.value.trim();
    if (val) {
        currentUsername = val;
        socket.emit('set_username', currentUsername);
        
        // Add fade out animation
        usernameModal.style.opacity = '0';
        setTimeout(() => {
            usernameModal.style.display = 'none';
        }, 300);
        
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Sending Messages
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if (msg) {
        socket.emit('chat_message', { message: msg });
        messageInput.value = '';
        socket.emit('stop_typing');
    }
});

// Typing Indicator Emission Logic
messageInput.addEventListener('input', () => {
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop_typing');
    }, 1500);
});

// Socket Events Listeners
socket.on('user_count', (count) => {
    userCountEl.textContent = `${count} Online`;
});

socket.on('chat_message', (data) => {
    const isOwn = data.username === currentUsername;
    
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isOwn ? 'own' : 'other');

    let innerHTML = '';
    if (!isOwn) {
        innerHTML += `<div class="message-sender">${escapeHTML(data.username)}</div>`;
    }
    innerHTML += `<div>${escapeHTML(data.message)}</div>`;
    innerHTML += `<div class="message-meta">${data.timestamp}</div>`;

    msgDiv.innerHTML = innerHTML;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
});

socket.on('user_joined', (username) => {
    addSystemMessage(`${escapeHTML(username)} joined the chat`);
});

socket.on('user_left', (username) => {
    addSystemMessage(`${escapeHTML(username)} left the chat`);
});

// Handle multiple people typing
let typers = new Set();
socket.on('typing', (username) => {
    if (username !== currentUsername) {
        typers.add(username);
        updateTypingIndicator();
    }
});

socket.on('stop_typing', (username) => {
    if (username !== currentUsername) {
        typers.delete(username);
        updateTypingIndicator();
    }
});

function updateTypingIndicator() {
    if (typers.size === 0) {
        typingIndicator.classList.add('hidden');
    } else {
        typingIndicator.classList.remove('hidden');
        if (typers.size === 1) {
            typingIndicator.textContent = `${escapeHTML(Array.from(typers)[0])} is typing...`;
        } else {
            typingIndicator.textContent = `Several people are typing...`;
        }
    }
    scrollToBottom();
}

function addSystemMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'system');
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
