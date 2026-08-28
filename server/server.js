const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/deliveries', require('./routes/deliveries')(io));

io.on('connection', (socket) => {
  // Realtime channel: clients just listen for request:new / request:updated.
  // No per-room targeting yet — see DESIGN.md trade-offs (#1).
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Deliva server running on http://localhost:${PORT}`));
