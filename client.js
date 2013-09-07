<!-- <script src='http://your socket.io/socket.io/socket.io.js'></script> -->
var socket = io.connect('your socket.io');

var user_connection_id = 'user';
var user_connection_info = 'test';

function emit(command, data) {
	socket.emit(command, data);
}

jQuery(function($) {
	emit('insert connection', {id: user_connection_id, info: user_connection_info});
	emit('get connection count');
});

socket.on('connection count', function(data) {
	console.log('connection count is '+data);
});