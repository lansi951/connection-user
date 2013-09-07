/*
 * Simple connection user server
 * by Lansi
 * eoz754@naver.com
 * blog.lansi.kr
 * @lansi951
 */

var io = require('socket.io');
var express = require('express');
var redis = require('redis'),
client = redis.createClient();

var app = express()
, http = require('http')
, server = http.createServer(app)
, io = io.listen(server);

server.listen(8888);

// express setting
// express 설정
app.use(express.static(__dirname));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');                 // use jade

// socket.io setting
// socket.io 설정
io.enable('browser client minification'); // send minified client
io.enable('browser client etag');               // apply etag caching logic based on version number
io.enable('browser client gzip');               // gzip the file
io.set('log level', 1);

var client_count = {}; // same client counting / 같은 클라이언트 카운팅
var session_id = {};     // user id of socket / 소켓의 유저 아이디

// show connetion users
// 접속중인 유저를 보여준다
app.get('/get_connection', function(req, res) {	
	var result = [];
	client.sort("connect_user", "by", "nosort", "get", "user:*->info", function(err, replies) {
		if (!replies) return res.send('');
		
		var i = 0;
		replies.forEach(function(reply) {
			if (!reply) return;
			
		    result[i] = reply.toString();
		    i++;
		});
		
		res.render('connection_list', {list: result});
	});
});

io.sockets.on('connection', function (socket) {	
	// insert new user
	// 새로운 유저를 추가
	socket.on('insert connection', function (data) {
		if (!data.id || !data.info) return;
		
		if (!client_count[data.id])
			client_count[data.id] = 0;
		if (!session_id[socket.id])
			session_id[socket.id] = data.id;
			
		// process only first connecting
		// 클라이언트가 처음 접속했을 때만 처리
		if (client_count[data.id] <= 0) {
			var key = 'user:'+data.id;
			client.hmset(key, 'id', data.id,  'info', data.info);			
			client.sadd("connect_user", data.id);			
		}
		
		client_count[data.id]++;
	});
	
	// get now connecting users count
	// 현재 연결된 유저수를 얻음
	socket.on('get connection count', function (data) {
		client.keys("user:*", function(err, keys) {
			var count = keys.length;	
			socket.emit('connection count', count);
		});
	});
	
	socket.on('disconnect', function () {
		var client_id = session_id[socket.id];
		client_count[client_id]--;
		
		// if same client count is 0, delete user connection info at the redis
		// 같은 클라이언트 수가 0이라면 redis에서 유저 접속 정보를 삭제
		if (client_count[client_id] <= 0) {
			client.del('user:'+client_id);
			delete client_count[client_id];	
			delete session_id[socket.id];	
		}
	});
});