const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Говорим Express, что мы работаем за прокси-сервером Render (это уберет блокировки)
app.set('trust proxy', 1);

const server = http.createServer(app);

// Настраиваем Socket.IO с максимальными правами доступа
const io = new Server(server, {
  cors: {
    origin: "*", // Разрешаем доступ абсолютно любым сайтам (включая Vercel)
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true // Поддержка старых протоколов для надежности
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

// На Render порт ВСЕГДА должен быть взят из process.env.PORT
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Сервер сигнализации Socket.IO запущен на порту ${PORT}`);
});