const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Store socket info by room and user
const rooms = {};
const users = {}; // Keep track of users and their socket IDs

io.on('connection', (socket) => {
  console.log('New client connected');

  // Store user information (optional, can store user ID, etc.)
  socket.on('register', (userId) => {
    users[userId] = socket.id; // Save userId and their socket ID
    console.log(`User registered with ID: ${userId}`);
  });

  // Handle when user joins a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    rooms[socket.id] = roomId;
    console.log(`User joined room: ${roomId}`);
  });

  // Handle when a call is initiated
  socket.on('call', (data) => {
    const { roomId, calleeId, callerName, callerNumber, userImage } = data;

    // Notify the callee of the incoming call
    const calleeSocketId = users[calleeId]; // Find callee's socket ID
    if (calleeSocketId) {
      io.to(calleeSocketId).emit('call', {
        callerName,
        callerNumber,
        userImage,
        roomId,
      });
      console.log(`Calling ${calleeId}`);
    } else {
      console.log(`Callee not found or not connected: ${calleeId}`);
    }
  });

  // Handle offer from caller
  socket.on('offer', (data) => {
    const roomId = rooms[socket.id];
    socket.to(roomId).emit('offer', data);
  });

  // Handle answer from callee
  socket.on('answer', (data) => {
    const roomId = rooms[socket.id];
    socket.to(roomId).emit('answer', data);
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const roomId = rooms[socket.id];
    socket.to(roomId).emit('ice-candidate', data);
  });

  // Handle call end
  socket.on('end-call', (roomId) => {
    socket.to(roomId).emit('end-call');
    console.log(`Call ended in room: ${roomId}`);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const roomId = rooms[socket.id];
    if (roomId) {
      socket.leave(roomId);
      delete rooms[socket.id];
    }

    // Remove from users as well
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }

    console.log('Client disconnected');
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));
