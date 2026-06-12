const URL_BACKEND = 'https://backend-paleonbot.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    let socket = null;

    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const connectionStatus = document.getElementById('connection-status');
    const iniciarBtn = document.getElementById('iniciarBtn');
    const encerrarBtn = document.getElementById('encerrarBtn');
    const limparBtn = document.getElementById('limparBtn');

    let userSessionId = null;

    // Scroll automático
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Adiciona mensagens ao chat
    function addMessageToChat(sender, text, type = 'normal') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        if (sender.toLowerCase() === 'user') {
            messageElement.classList.add('user-message');
            sender = 'Você';
        } else if (sender.toLowerCase() === 'bot') {
            messageElement.classList.add('bot-message');
            sender = 'Bot';
        } else {
            messageElement.classList.add('status-message');
        }

        if (type === 'error') {
            messageElement.classList.add('error-text');
            sender = 'Erro';
        } else if (type === 'status') {
            messageElement.classList.add('status-text');
            sender = 'Status';
        }

        const senderSpan = document.createElement('strong');
        senderSpan.textContent = `${sender}: `;
        messageElement.appendChild(senderSpan);

        const textSpan = document.createElement('span');

        if (type === 'normal') {
            textSpan.innerHTML = marked.parse(text);
        } else {
            textSpan.textContent = text;
        }

        messageElement.appendChild(textSpan);

        chatBox.appendChild(messageElement);

        // Faz o chat descer automaticamente
        scrollToBottom();
    }

    // Habilita ou desabilita o campo de mensagens
    function setChatEnabled(enabled) {
        messageInput.disabled = !enabled;
        sendButton.disabled = !enabled;
    }

    // Estado inicial
    setChatEnabled(false);

    connectionStatus.textContent = 'Desconectado';
    connectionStatus.className = 'status-offline';

    addMessageToChat(
        'Status',
        'Clique em "Iniciar Investigação" para começar.',
        'status'
    );

    // Conecta ao servidor
    function iniciarConversa() {
        if (socket && socket.connected) return;

        socket = io(URL_BACKEND);

        socket.on('connect', () => {
            console.log('Conectado! SID:', socket.id);

            connectionStatus.textContent = 'Conectado';
            connectionStatus.className = 'status-online';

            addMessageToChat(
                'Status',
                'Conectado ao servidor de chat.',
                'status'
            );

            setChatEnabled(true);
        });

        socket.on('disconnect', () => {
            console.log('Desconectado.');

            connectionStatus.textContent = 'Desconectado';
            connectionStatus.className = 'status-offline';

            addMessageToChat(
                'Status',
                'Você foi desconectado.',
                'status'
            );

            setChatEnabled(false);
        });

        socket.on('status_conexao', (data) => {
            if (data.session_id) {
                userSessionId = data.session_id;
            }
        });

        socket.on('nova_mensagem', (data) => {
            addMessageToChat(data.remetente, data.texto);
        });

        socket.on('erro', (data) => {
            addMessageToChat('Erro', data.erro, 'error');
        });
    }

    // Encerra conversa
    function encerrarConversa() {
        if (socket && socket.connected) {
            socket.disconnect();

            setChatEnabled(false);

            addMessageToChat(
                'Status',
                'Conversa encerrada pelo usuário.',
                'status'
            );
        }
    }

    // Limpa mensagens
    function limparTela() {
        chatBox.innerHTML = '';

        addMessageToChat(
            'Status',
            'Registros apagados.',
            'status'
        );
    }

    // Envia mensagem
    function sendMessageToServer() {
        const messageText = messageInput.value.trim();

        if (!messageText) return;

        if (socket && socket.connected) {
            addMessageToChat('user', messageText);

            socket.emit('enviar_mensagem', {
                mensagem: messageText
            });

            messageInput.value = '';
            messageInput.focus();
        } else {
            addMessageToChat(
                'Erro',
                'Não conectado ao servidor.',
                'error'
            );
        }
    }

    // Eventos
    iniciarBtn.addEventListener('click', iniciarConversa);
    encerrarBtn.addEventListener('click', encerrarConversa);
    limparBtn.addEventListener('click', limparTela);

    sendButton.addEventListener('click', sendMessageToServer);

    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessageToServer();
        }
    });
});