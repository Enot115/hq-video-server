const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.set('trust proxy', 1); // Включаем доверие к прокси-серверу Render

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Полный доступ для любых внешних сайтов (включая Vercel)
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

app.get('/', (req, res) => {
  res.send('🚀 HQ Signaling Server is Online and Ready!');
});

io.on('connection', (socket) => {
  console.log(`📱 Подключился клиент: ${socket.id}`);

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`🏠 Клиент ${socket.id} вошел в комнату: ${room}`);
    socket.to(room).emit('user-joined', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data.offer);
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data.answer);
  });

  socket.on('candidate', (data) => {
    socket.to(data.room).emit('candidate', data.candidate);
  });

  socket.on('disconnect', () => {
    console.log(`🛑 Клиент отключился: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Сервер сигнализации Socket.IO запущен на порту ${PORT}`);
});