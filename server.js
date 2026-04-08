const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let connectedUsers = 0;

io.on('connection', (socket) => {
    connectedUsers++;
    io.emit('user_count', connectedUsers);

    socket.on('disconnect', () => {
        connectedUsers--;
        io.emit('user_count', connectedUsers);
        if (socket.username) {
            socket.broadcast.emit('user_left', socket.username);
        }
    });

    socket.on('set_username', (username) => {
        socket.username = username;
        socket.broadcast.emit('user_joined', username);
    });

    const botReplies = [
        "That's awesome! Tell me more.",
        "I see! That makes sense.",
        "Wow, really?",
        "Haha, no way!",
        "I'm just a bot, but I completely agree.",
        "Can you explain that a bit more?",
        "Sounds like a plan!",
        "Fascinating stuff."
    ];

    socket.on('chat_message', (data) => {
        // Broadcast the message to all clients
        io.emit('chat_message', {
            username: socket.username || 'Anonymous',
            message: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // Trigger bot auto-reply
        if (socket.username !== 'AuroraBot') {
            setTimeout(() => {
                // Simulate typing
                io.emit('typing', 'AuroraBot');
                
                setTimeout(() => {
                    io.emit('stop_typing', 'AuroraBot');
                    const reply = botReplies[Math.floor(Math.random() * botReplies.length)];
                    io.emit('chat_message', {
                        username: 'AuroraBot',
                        message: reply,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }, 1500 + Math.random() * 1000); // typing duration
            }, 600); // wait before typing
        }
    });

    socket.on('typing', () => {
        socket.broadcast.emit('typing', socket.username || 'Someone');
    });

    socket.on('stop_typing', () => {
        socket.broadcast.emit('stop_typing', socket.username || 'Someone');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
