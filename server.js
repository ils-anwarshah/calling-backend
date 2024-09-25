// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Store socket info by room
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    rooms[socket.id] = roomId;
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('offer', (data) => {
    const roomId = rooms[socket.id];
    socket.to(roomId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    const roomId = rooms[socket.id];
    socket.to(roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    const roomId = rooms[socket.id];
    socket.to(roomId).emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    const roomId = rooms[socket.id];
    if (roomId) {
      socket.leave(roomId);
      delete rooms[socket.id];
    }
    console.log('Client disconnected');
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));
