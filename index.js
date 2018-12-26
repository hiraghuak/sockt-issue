var express = require('express');
var socket = require('socket.io');

// App setup
var app = express();
var server = app.listen(4000, function () {
    console.log('listening for requests on port 4000,');
});

// Static files
app.use(express.static('public'));

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {
    const _id = socket.id;
    console.log('made socket connection', _id);

    // Handle chat event
    socket.on('chat', function (data) {
        io.to(`${socketId}`).emit('chat', data);
    });

    socket.on('videoIndexO', function (data) {
        io.sockets.emit('videoIndexO', data);
    });

    socket.on('disconnect', () => {
        io.emit('myCustomEvent', {customEvent: 'Custom Message'})
        console.log('Socket disconnected: ' + _id)
    })

});