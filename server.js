const { WebSocketServer } = require('ws');

// Порт берем из среды окружения облака (процесс Render/Railway сам назначит его)
const PORT = process.env.PORT || 5000;
const wss = new WebSocketServer({ port: PORT });

// Хранилище комнат и подключенных пользователей
const rooms = new Map();

console.log(`🚀 Глобальный сервер сигнализации запущен на порту ${PORT}`);

wss.on('connection', (ws) => {
    let currentRoom = null;
    let userId = Math.random().toString(36).substring(7);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                // Когда пользователь заходит в комнату
                case 'join':
                    currentRoom = data.room;
                    if (!rooms.has(currentRoom)) {
                        rooms.set(currentRoom, new Set());
                    }
                    rooms.get(currentRoom).add(ws);
                    ws.userId = userId;

                    console.log(`📱 Пользователь ${userId} зашел в комнату: ${currentRoom}`);

                    // Оповещаем остальных в комнате, что зашел новый участник
                    broadcastToRoom(currentRoom, ws, { type: 'user-joined', userId: userId });
                    break;

                // Пересылка WebRTC офферов, ответов и ICE-кандидатов
                case 'offer':
                case 'answer':
                case 'candidate':
                    if (currentRoom) {
                        broadcastToRoom(currentRoom, ws, data);
                    }
                    break;
            }
        } catch (e) {
            console.error("Ошибка обработки сообщения:", e);
        }
    });

    ws.on('close', () => {
        if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).delete(ws);
            if (rooms.get(currentRoom).size === 0) {
                rooms.delete(currentRoom);
            } else {
                broadcastToRoom(currentRoom, ws, { type: 'user-left', userId: userId });
            }
        }
        console.log(`🛑 Пользователь ${userId} отключился`);
    });
});

// Функция отправки сообщений всем в комнате, кроме самого отправителя
function broadcastToRoom(roomName, senderWs, data) {
    const room = rooms.get(roomName);
    if (!room) return;

    const messageString = JSON.stringify(data);
    room.forEach((client) => {
        if (client !== senderWs && client.readyState === 1) { // 1 означает OPEN
            client.send(messageString);
        }
    });
}