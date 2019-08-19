import path from 'path'
import http from 'http'
import Express from 'express'
import socketio from 'socket.io'

const app = Express()
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 3000

app.use(Express.static(path.join(__dirname, 'public')))

server.listen(port, () => {
	console.log('Server listening at port %d', port)
})

let onlineUsers = 0

io.on('connection', socket => {
	let addedUser = false
	
	socket.on('newMessage', data => {
		socket.broadcast.emit('newMessage', {
			username: socket.username,
			message: data
		});
		
		console.log('New message', data)
	})
	
	socket.on('addUser', (username) => {
		if (addedUser) return
		
		socket.username = username
		++onlineUsers
		addedUser = true
		
		socket.emit('login', {
			onlineUsers
		})
		
		socket.broadcast.emit('userJoined', {
			username: socket.username,
			onlineUsers
		})
		
		console.log(`User ${username} added`)
	})
	
	socket.on('typing', () => {
		socket.broadcast.emit('typing', {
			username: socket.username
		})
	})
	
	socket.on('stopTyping', () => {
		socket.broadcast.emit('stopTyping', {
			username: socket.username
		})
	})
	
	socket.on('disconnect', () => {
		if (addedUser) {
			--onlineUsers
			
			socket.broadcast.emit('userLeft', {
				username: socket.username,
				onlineUsers
			})
		}
	})
})
