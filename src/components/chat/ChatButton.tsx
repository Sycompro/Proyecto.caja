import React, { useState, useEffect } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { chatService } from '../../services/chatService';
import ChatInterface from './ChatInterface';

const ChatButton: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = () => {
      // En un sistema real, esto sería más específico por sala
      setUnreadCount(chatService.getUnreadCount('general'));
    };

    const unsubscribe = chatService.subscribeToMessages(() => {
      updateUnreadCount();
    });

    updateUnreadCount();

    return unsubscribe;
  }, []);

  const handleToggleChat = () => {
    if (showChat) {
      setIsMinimized(!isMinimized);
    } else {
      setShowChat(true);
      setIsMinimized(false);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Chat Button */}
      {!showChat && (
        <button
          onClick={handleToggleChat}
          className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 group"
          title="Abrir Chat"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Chat del Sistema
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Interface */}
      {showChat && (
        <ChatInterface
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
          onClose={handleCloseChat}
        />
      )}

      {/* Floating Users Indicator */}
      {showChat && !isMinimized && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {chatService.getUsers().filter(u => u.isOnline).length + 1} en línea
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatButton;