(() => {
	const FADE_TIME = 150
	const TYPING_TIMER_LENGTH = 1000
	const COLORS = [
		'#e21400', '#91580f', '#f8a700', '#f78b00',
		'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
		'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
	]
	
	const usernameInput = document.getElementsByClassName('usernameInput')[0]
	const messagesContainer = document.getElementsByClassName('messages')[0]
	const inputMessage = document.getElementsByClassName('inputMessage')[0]
	
	const loginPage = document.getElementsByClassName('login page')[0]
	const chatPage = document.getElementsByClassName('chat page')[0]
	
	let username
	let isConnected = false
	let isTyping = false
	let lastTypingTime
	let currentInput = usernameInput
	
	const socket = io()
	
	const log = (message, options = {}) => {
		const el = document.createElement('li')
		el.className = 'log'
		el.innerHTML = message
		
		addMessageElement(el, options);
		console.log(message)
	}

	const getUsernameColor = (username) => {
		let hash = 7;
		for (let i = 0; i < username.length; i++) {
		   hash = username.charCodeAt(i) + (hash << 5) - hash
		}
		
		const index = Math.abs(hash % COLORS.length)
		return COLORS[index]
	  }
	
	const setUsername = () => {
		username = usernameInput.value.trim()
		
		if (username) {
			loginPage.classList.add('hidden')
			chatPage.classList.add('visible')
			currentInput = inputMessage

			socket.emit('addUser', username)
		}
	}

	const clearInput = (input) => {
		const div = document.createElement('div')
		div.innerText = input
		
		return div.innerHTML
	}

	const addChatMessage = (data, options = {}) => {
		const typingMessages = getTypingMessages(data)

		if (typingMessages.length !== 0) {
			options.fade = false
			typingMessages.map(div => {
				div.parentNode.removeChild(div)
			})
		}

		const usernameDiv = document.createElement('span')
		usernameDiv.setAttribute('class', 'username')
		usernameDiv.setAttribute('style', `color: ${getUsernameColor(data.username)}`)
		usernameDiv.innerHTML = data.username

		const messageBody = document.createElement('span')
		messageBody.setAttribute('class', 'messageBody')
		messageBody.innerHTML = data.message

		const messageDiv = document.createElement('li')
		messageDiv.setAttribute('data-username', data.username)
		messageDiv.setAttribute('class', 'message')

		if (data.typing) {
			messageDiv.classList.add('typing')
		}

		messageDiv.appendChild(usernameDiv)
		messageDiv.appendChild(messageBody)

		addMessageElement(messageDiv)
	}

	const addMessageElement = (elem) => {
		messagesContainer.appendChild(elem)
		messagesContainer.scrollTop = messagesContainer.scrollHeight
	}

	const sendMessage = () => {
		const message = clearInput(inputMessage.value)

		if (message && isConnected) {
			inputMessage.value = ''

			addChatMessage({
				username,
				message,
			})

			socket.emit('newMessage', message)
		}
	}

	const updateTyping = () => {
		if (isConnected) {
			if (!isTyping) {
				isTyping = true
				socket.emit('typing')
			}
		}

		lastTypingTime = (new Date()).getTime()

		setTimeout(() => {
			const typingTimer = (new Date()).getTime()
			const timeDiff = typingTimer - lastTypingTime

			if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
			  socket.emit('stopTyping')
			  typing = false
			}
		  }, TYPING_TIMER_LENGTH)
	}

	const addChatTyping = (data) => {
		data.typing = true;
		data.message = 'está escrevendo...';
		addChatMessage(data);
	}

	const removeChatTyping = (data) => {
		const typingMessageDiv = getTypingMessages(data)
		
		typingMessageDiv.map(div => {
			div.classList.add('hidden')
			setTimeout(() => div.parentNode.removeChild(typingMessageDiv), 2000)
		})
	  }

	const getTypingMessages = (data) => {
		const typingDiv = [...document.getElementsByClassName('typing message')]
		
		return typingDiv.filter(elem => 
			elem.getAttribute('data-username') === data.username
		)
	}

	const addParticipantsMessage = data =>
		data.onlineUsers === 1
			? log('1 usuário online')
			: log(`${data.onlineUsers} usuários online`)
	
	window.addEventListener('keydown', event => {
		if (!(event.ctrlKey || event.metaKey || event.altKey)) {
			currentInput.focus()
		}
		
		const isEnterKeyPressed = event.which === 13
		
		if (isEnterKeyPressed) {
			if (!username) {
				return setUsername()
			}

			sendMessage()
			socket.emit('stopTyping')
			isTyping = false
		}

		typing = false
	})

	inputMessage.addEventListener('input', () => updateTyping())

	socket.on('login', data => {
		isConnected = true

		log('Bem vindo ao chat')
		addParticipantsMessage(data)
	})

	socket.on('newMessage', data => addChatMessage(data))

	socket.on('userJoined', data => {
		log(data.username + ' entrou')
		addParticipantsMessage(data)
	})

	socket.on('userLeft', (data) => {
		log(`${data.username} saiu`)
		addParticipantsMessage(data)
	})

	socket.on('typing', (data) => addChatTyping(data))
	socket.on('stopTyping', (data) => removeChatTyping(data))
	socket.on('disconnect', () => log('Você foi desconectado'))

	socket.on('reconnect', () => {
		log('Você foi reconectado')

		if (username) {
		  socket.emit('addUser', username)
		}
	})
	
	socket.on('reconnect_error', () => log('Falha ao reconectar o chat'))
	
	
	console.log('App initiated')
})()
