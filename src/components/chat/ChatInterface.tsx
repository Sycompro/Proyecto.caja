import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Smile, 
  Paperclip, 
  Users, 
  Settings,
  Search,
  Phone,
  Video,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  Copy,
  Hash,
  Lock,
  Globe,
  Plus,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { chatService, ChatMessage, ChatRoom, ChatUser, TypingIndicator } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

interface ChatInterfaceProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isMinimized = false, 
  onToggleMinimize,
  onClose 
}) => {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user) {
      chatService.setCurrentUser(user.id, user.fullName, user.role);
      
      const unsubscribeMessages = chatService.subscribeToMessages(setMessages);
      const unsubscribeRooms = chatService.subscribeToRooms(setRooms);
      const unsubscribeTyping = chatService.subscribeToTyping(setTypingUsers);

      // Cargar datos iniciales
      setMessages(chatService.getMessages(activeRoom));
      setRooms(chatService.getRooms());
      setUsers(chatService.getUsers());

      return () => {
        unsubscribeMessages();
        unsubscribeRooms();
        unsubscribeTyping();
        chatService.updateUserStatus('offline');
      };
    }
  }, [user]);

  useEffect(() => {
    setMessages(chatService.getMessages(activeRoom));
    chatService.markMessagesAsRead(activeRoom);
  }, [activeRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    if (editingMessage) {
      chatService.editMessage(editingMessage, newMessage);
      setEditingMessage(null);
    } else {
      chatService.sendMessage(
        activeRoom, 
        newMessage, 
        'text', 
        replyingTo?.id
      );
    }

    setNewMessage('');
    setReplyingTo(null);
    messageInputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    chatService.setTyping(activeRoom);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      chatService.clearTyping(activeRoom);
    }, 1000);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    chatService.addReaction(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage(message.id);
    setNewMessage(message.content);
    messageInputRef.current?.focus();
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      chatService.deleteMessage(messageId);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  const getMessageGroups = () => {
    const groups: { [date: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);
  const currentTyping = typingUsers.filter(t => t.roomId === activeRoom);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <MessageSquare className="w-6 h-6" />
          {chatService.getUnreadCount(activeRoom) > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {chatService.getUnreadCount(activeRoom)}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              {activeRoomData?.type === 'admin' && <Lock className="w-4 h-4" />}
              {activeRoomData?.type === 'general' && <Globe className="w-4 h-4" />}
              {activeRoomData?.type === 'private' && <Hash className="w-4 h-4" />}
              <span>{activeRoomData?.name}</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeRoomData?.participants.length} participantes
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRoomSettings(!showRoomSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Room Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setActiveRoom(room.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeRoom === room.id
                ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              {room.type === 'admin' && <Lock className="w-3 h-3" />}
              {room.type === 'general' && <Globe className="w-3 h-3" />}
              {room.type === 'private' && <Hash className="w-3 h-3" />}
              <span className="truncate">{room.name}</span>
              {chatService.getUnreadCount(room.id) > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {chatService.getUnreadCount(room.id)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(getMessageGroups()).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{date}</span>
              </div>
            </div>

            {/* Messages */}
            {dayMessages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const showAvatar = index === 0 || dayMessages[index - 1].senderId !== message.senderId;
              const isSystem = message.type === 'system';

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{message.content}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`flex items-end space-x-2 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    {showAvatar && !isOwn && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!showAvatar && !isOwn && <div className="w-8" />}

                    {/* Message Bubble */}
                    <div className="relative">
                      {/* Reply indicator */}
                      {message.replyTo && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
                          Respondiendo a mensaje...
                        </div>
                      )}

                      {/* Sender name */}
                      {showAvatar && !isOwn && (
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-3">
                          {message.senderName}
                          {message.senderRole === 'admin' && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">👑</span>
                          )}
                        </div>
                      )}

                      {/* Message content */}
                      <div
                        className={`px-3 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        } ${showAvatar ? '' : 'mt-1'}`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        
                        {/* Message info */}
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatTime(message.timestamp)}
                            {message.isEdited && <span className="ml-1">(editado)</span>}
                          </span>
                        </div>
                      </div>

                      {/* Reactions */}
                      {Object.keys(message.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(message.reactions).map(([emoji, userIds]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji)}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                                userIds.includes(user?.id || '')
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message actions */}
                      <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
                          <button
                            onClick={() => setShowEmojiPicker(message.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReplyingTo(message)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                          {isOwn && (
                            <>
                              <button
                                onClick={() => handleEditMessage(message)}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Emoji picker */}
                      {showEmojiPicker === message.id && (
                        <div className="absolute top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
                          <div className="flex space-x-1">
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicators */}
        {currentTyping.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">
              {currentTyping.map(t => t.userName).join(', ')} está{currentTyping.length > 1 ? 'n' : ''} escribiendo...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Respondiendo a {replyingTo.senderName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder={editingMessage ? 'Editar mensaje...' : 'Escribe un mensaje...'}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            
            {/* Input actions */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <button className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded">
                <Smile className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {editingMessage && (
          <div className="flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Editando mensaje</span>
            <button
              onClick={() => {
                setEditingMessage(null);
                setNewMessage('');
              }}
              className="text-red-500 hover:text-red-700"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* User List Sidebar */}
      {showUserList && (
        <div className="absolute top-0 right-0 w-64 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 rounded-r-xl">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Participantes</h4>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {users.map((chatUser) => (
              <div key={chatUser.id} className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {chatUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                    chatUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {chatUser.name}
                    {chatUser.role === 'admin' && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">👑</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {chatUser.isOnline ? chatUser.status : 'Desconectado'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(null)}
        />
      )}
    </div>
  );
};

export default ChatInterface;