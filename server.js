const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Настраиваем Socket.IO с разрешением CORS для любых подключений
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Простой ответ для проверки, что сервер жив
app.get('/', (req, res) => {
  res.send('🚀 HQ Signaling Server is Running!');
});

io.on('connection', (socket) => {
  console.log(`📱 Пользователь подключился: ${socket.id}`);

  // Когда пользователь входит в комнату
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`🏠 Пользователь ${socket.id} зашел в комнату: ${room}`);
    
    // Говорим остальным в комнате, что зашел новый участник
    socket.to(room).emit('user-joined', socket.id);
  });

  // Пересылка WebRTC офферов
  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data.offer);
  });

  // Пересылка WebRTC ответов
  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data.answer);
  });

  // Пересылка ICE-кандидатов (сетевых настроек)
  socket.on('candidate', (data) => {
    socket.to(data.room).emit('candidate', data.candidate);
  });

  socket.on('disconnect', () => {
    console.log(`🛑 Пользователь отключился: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🔥 Сервер работает на порту ${PORT}`);
});