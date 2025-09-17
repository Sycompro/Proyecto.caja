interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'user';
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  isRead: boolean;
  replyTo?: string; // ID del mensaje al que responde
  reactions: { [emoji: string]: string[] }; // emoji -> array de userIds
  isEdited: boolean;
  editedAt?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'admin' | 'private';
  participants: string[]; // userIds
  createdBy: string;
  createdAt: string;
  lastMessage?: ChatMessage;
  isActive: boolean;
  settings: {
    allowFiles: boolean;
    allowImages: boolean;
    adminOnly: boolean;
  };
}

interface ChatUser {
  id: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  statusMessage?: string;
}

interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  timestamp: string;
}

class ChatService {
  private messages: ChatMessage[] = [];
  private rooms: ChatRoom[] = [];
  private users: ChatUser[] = [];
  private typingIndicators: TypingIndicator[] = [];
  private messageListeners: ((messages: ChatMessage[]) => void)[] = [];
  private roomListeners: ((rooms: ChatRoom[]) => void)[] = [];
  private typingListeners: ((typing: TypingIndicator[]) => void)[] = [];
  private currentUserId: string | null = null;

  constructor() {
    this.loadData();
    this.initializeDefaultRooms();
    this.startTypingCleanup();
  }

  // Inicialización
  private loadData(): void {
    this.messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    this.rooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
    this.users = JSON.parse(localStorage.getItem('chatUsers') || '[]');
  }

  private saveData(): void {
    localStorage.setItem('chatMessages', JSON.stringify(this.messages));
    localStorage.setItem('chatRooms', JSON.stringify(this.rooms));
    localStorage.setItem('chatUsers', JSON.stringify(this.users));
    this.notifyListeners();
  }

  private initializeDefaultRooms(): void {
    if (this.rooms.length === 0) {
      const defaultRooms: ChatRoom[] = [
        {
          id: 'general',
          name: 'General',
          description: 'Chat general para todos los usuarios',
          type: 'general',
          participants: [],
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          isActive: true,
          settings: {
            allowFiles: true,
            allowImages: true,
            adminOnly: false
          }
        },
        {
          id: 'admin',
          name: 'Administradores',
          description: 'Chat exclusivo para administradores',
          type: 'admin',
          participants: [],
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          isActive: true,
          settings: {
            allowFiles: true,
            allowImages: true,
            adminOnly: true
          }
        }
      ];

      this.rooms = defaultRooms;
      this.saveData();
    }
  }

  // Gestión de usuarios
  setCurrentUser(userId: string, userName: string, role: 'admin' | 'user'): void {
    this.currentUserId = userId;
    
    // Actualizar o crear usuario
    const existingUserIndex = this.users.findIndex(u => u.id === userId);
    const userData: ChatUser = {
      id: userId,
      name: userName,
      role,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      status: 'available'
    };

    if (existingUserIndex >= 0) {
      this.users[existingUserIndex] = { ...this.users[existingUserIndex], ...userData };
    } else {
      this.users.push(userData);
    }

    // Agregar a salas apropiadas
    this.addUserToRooms(userId, role);
    this.saveData();
  }

  private addUserToRooms(userId: string, role: 'admin' | 'user'): void {
    this.rooms.forEach(room => {
      if (!room.participants.includes(userId)) {
        if (room.type === 'general' || (room.type === 'admin' && role === 'admin')) {
          room.participants.push(userId);
        }
      }
    });
  }

  updateUserStatus(status: 'available' | 'busy' | 'away' | 'offline', statusMessage?: string): void {
    if (!this.currentUserId) return;

    const userIndex = this.users.findIndex(u => u.id === this.currentUserId);
    if (userIndex >= 0) {
      this.users[userIndex].status = status;
      this.users[userIndex].isOnline = status !== 'offline';
      this.users[userIndex].lastSeen = new Date().toISOString();
      if (statusMessage !== undefined) {
        this.users[userIndex].statusMessage = statusMessage;
      }
      this.saveData();
    }
  }

  // Gestión de mensajes
  sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text', replyTo?: string): string {
    if (!this.currentUserId) throw new Error('Usuario no autenticado');

    const user = this.users.find(u => u.id === this.currentUserId);
    if (!user) throw new Error('Usuario no encontrado');

    const message: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId: this.currentUserId,
      senderName: user.name,
      senderRole: user.role,
      content,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      replyTo,
      reactions: {},
      isEdited: false
    };

    this.messages.push(message);

    // Actualizar último mensaje de la sala
    const roomIndex = this.rooms.findIndex(r => r.id === roomId);
    if (roomIndex >= 0) {
      this.rooms[roomIndex].lastMessage = message;
    }

    this.saveData();
    this.clearTyping(roomId);

    // Notificar a otros usuarios
    this.notifyNewMessage(message, roomId);

    return message.id;
  }

  editMessage(messageId: string, newContent: string): boolean {
    const messageIndex = this.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    const message = this.messages[messageIndex];
    if (message.senderId !== this.currentUserId) return false;

    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date().toISOString();

    this.saveData();
    return true;
  }

  deleteMessage(messageId: string): boolean {
    const messageIndex = this.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    const message = this.messages[messageIndex];
    if (message.senderId !== this.currentUserId) return false;

    this.messages.splice(messageIndex, 1);
    this.saveData();
    return true;
  }

  // Reacciones
  addReaction(messageId: string, emoji: string): void {
    if (!this.currentUserId) return;

    const message = this.messages.find(m => m.id === messageId);
    if (!message) return;

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }

    if (!message.reactions[emoji].includes(this.currentUserId)) {
      message.reactions[emoji].push(this.currentUserId);
      this.saveData();
    }
  }

  removeReaction(messageId: string, emoji: string): void {
    if (!this.currentUserId) return;

    const message = this.messages.find(m => m.id === messageId);
    if (!message || !message.reactions[emoji]) return;

    message.reactions[emoji] = message.reactions[emoji].filter(id => id !== this.currentUserId);
    
    if (message.reactions[emoji].length === 0) {
      delete message.reactions[emoji];
    }

    this.saveData();
  }

  // Indicador de escritura
  setTyping(roomId: string): void {
    if (!this.currentUserId) return;

    const user = this.users.find(u => u.id === this.currentUserId);
    if (!user) return;

    // Remover indicador anterior
    this.typingIndicators = this.typingIndicators.filter(
      t => !(t.userId === this.currentUserId && t.roomId === roomId)
    );

    // Agregar nuevo indicador
    this.typingIndicators.push({
      userId: this.currentUserId,
      userName: user.name,
      roomId,
      timestamp: new Date().toISOString()
    });

    this.notifyTypingListeners();

    // Auto-limpiar después de 3 segundos
    setTimeout(() => {
      this.clearTyping(roomId);
    }, 3000);
  }

  clearTyping(roomId: string): void {
    if (!this.currentUserId) return;

    this.typingIndicators = this.typingIndicators.filter(
      t => !(t.userId === this.currentUserId && t.roomId === roomId)
    );

    this.notifyTypingListeners();
  }

  private startTypingCleanup(): void {
    setInterval(() => {
      const now = new Date().getTime();
      this.typingIndicators = this.typingIndicators.filter(t => {
        const age = now - new Date(t.timestamp).getTime();
        return age < 5000; // Limpiar después de 5 segundos
      });
      this.notifyTypingListeners();
    }, 1000);
  }

  // Gestión de salas
  createRoom(name: string, description: string, type: 'general' | 'admin' | 'private' = 'general'): string {
    if (!this.currentUserId) throw new Error('Usuario no autenticado');

    const room: ChatRoom = {
      id: Date.now().toString(),
      name,
      description,
      type,
      participants: [this.currentUserId],
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      isActive: true,
      settings: {
        allowFiles: true,
        allowImages: true,
        adminOnly: type === 'admin'
      }
    };

    this.rooms.push(room);
    this.saveData();

    // Mensaje de sistema
    this.sendSystemMessage(room.id, `Sala "${name}" creada`);

    return room.id;
  }

  joinRoom(roomId: string): boolean {
    if (!this.currentUserId) return false;

    const roomIndex = this.rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) return false;

    const room = this.rooms[roomIndex];
    if (!room.participants.includes(this.currentUserId)) {
      room.participants.push(this.currentUserId);
      this.saveData();

      // Mensaje de sistema
      const user = this.users.find(u => u.id === this.currentUserId);
      this.sendSystemMessage(roomId, `${user?.name} se unió a la sala`);
    }

    return true;
  }

  leaveRoom(roomId: string): boolean {
    if (!this.currentUserId) return false;

    const roomIndex = this.rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) return false;

    const room = this.rooms[roomIndex];
    room.participants = room.participants.filter(id => id !== this.currentUserId);
    this.saveData();

    // Mensaje de sistema
    const user = this.users.find(u => u.id === this.currentUserId);
    this.sendSystemMessage(roomId, `${user?.name} salió de la sala`);

    return true;
  }

  private sendSystemMessage(roomId: string, content: string): void {
    const message: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: 'Sistema',
      senderRole: 'admin',
      content,
      type: 'system',
      timestamp: new Date().toISOString(),
      isRead: false,
      reactions: {},
      isEdited: false
    };

    this.messages.push(message);
    this.saveData();
  }

  // Marcar mensajes como leídos
  markMessagesAsRead(roomId: string): void {
    if (!this.currentUserId) return;

    this.messages.forEach(message => {
      if (message.senderId !== this.currentUserId) {
        // En un sistema real, esto sería por sala
        message.isRead = true;
      }
    });

    this.saveData();
  }

  // Obtener datos
  getMessages(roomId: string, limit: number = 50): ChatMessage[] {
    return this.messages
      .filter(m => {
        // En un sistema real, los mensajes tendrían roomId
        // Por ahora, mostramos todos los mensajes en todas las salas
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  getRooms(): ChatRoom[] {
    if (!this.currentUserId) return [];

    const user = this.users.find(u => u.id === this.currentUserId);
    if (!user) return [];

    return this.rooms.filter(room => {
      if (room.type === 'admin' && user.role !== 'admin') {
        return false;
      }
      return room.participants.includes(this.currentUserId!) || room.type === 'general';
    });
  }

  getUsers(): ChatUser[] {
    return this.users.filter(u => u.id !== this.currentUserId);
  }

  getTypingUsers(roomId: string): TypingIndicator[] {
    return this.typingIndicators.filter(t => 
      t.roomId === roomId && t.userId !== this.currentUserId
    );
  }

  getUnreadCount(roomId: string): number {
    return this.messages.filter(m => 
      !m.isRead && m.senderId !== this.currentUserId
    ).length;
  }

  // Notificaciones
  private notifyNewMessage(message: ChatMessage, roomId: string): void {
    // Importar dinámicamente para evitar dependencias circulares
    import('./notificationService').then(({ notificationService }) => {
      if (message.senderId !== this.currentUserId) {
        notificationService.addNotification({
          type: 'info',
          title: `💬 Nuevo mensaje de ${message.senderName}`,
          message: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
          metadata: { roomId, messageId: message.id }
        });
      }
    });
  }

  // Suscripciones
  subscribeToMessages(callback: (messages: ChatMessage[]) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  subscribeToRooms(callback: (rooms: ChatRoom[]) => void): () => void {
    this.roomListeners.push(callback);
    return () => {
      this.roomListeners = this.roomListeners.filter(listener => listener !== callback);
    };
  }

  subscribeToTyping(callback: (typing: TypingIndicator[]) => void): () => void {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.messageListeners.forEach(listener => listener(this.messages));
    this.roomListeners.forEach(listener => listener(this.rooms));
  }

  private notifyTypingListeners(): void {
    this.typingListeners.forEach(listener => listener(this.typingIndicators));
  }

  // Búsqueda
  searchMessages(query: string, roomId?: string): ChatMessage[] {
    return this.messages.filter(message => {
      const matchesQuery = message.content.toLowerCase().includes(query.toLowerCase()) ||
                          message.senderName.toLowerCase().includes(query.toLowerCase());
      
      if (roomId) {
        // En un sistema real, filtrarías por roomId
        return matchesQuery;
      }
      
      return matchesQuery;
    });
  }

  // Estadísticas
  getStats(): {
    totalMessages: number;
    totalRooms: number;
    activeUsers: number;
    messagesThisWeek: number;
  } {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return {
      totalMessages: this.messages.length,
      totalRooms: this.rooms.length,
      activeUsers: this.users.filter(u => u.isOnline).length,
      messagesThisWeek: this.messages.filter(m => 
        new Date(m.timestamp) > oneWeekAgo
      ).length
    };
  }
}

export const chatService = new ChatService();
export type { ChatMessage, ChatRoom, ChatUser, TypingIndicator };