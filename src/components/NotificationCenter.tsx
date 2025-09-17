import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings, Filter } from 'lucide-react';
import { notificationService, Notification, NotificationConfig } from '../services/notificationService';
import { realtimeService } from '../services/realtimeService';

interface NotificationCenterProps {
  userId?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'today'>('all');
  const [config, setConfig] = useState<NotificationConfig>(notificationService.getConfig());

  useEffect(() => {
    const unsubscribeNotifications = notificationService.subscribe((allNotifications) => {
      const userNotifications = notificationService.getNotifications(userId);
      setNotifications(userNotifications);
      setUnreadCount(notificationService.getUnreadCount(userId));
    });

    // Suscribirse a actualizaciones en tiempo real
    const unsubscribeRealtime = realtimeService.subscribe('notification', (event) => {
      console.log('🔄 Actualización de notificación en tiempo real:', event);
      // Las notificaciones se actualizarán automáticamente a través del servicio
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeRealtime();
    };
  }, [userId]);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(userId);
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      notificationService.clearAll(userId);
    }
  };

  const handleConfigUpdate = (newConfig: Partial<NotificationConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    notificationService.updateConfig(updatedConfig);
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = notifications.filter(n => 
          new Date(n.createdAt).toDateString() === today
        );
        break;
      default:
        break;
    }
    
    return filtered.slice(0, 50); // Limitar a 50 notificaciones
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      info: '🔔',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      request: '📋',
      approval: '✅'
    };
    return iconMap[type as keyof typeof iconMap] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      error: 'red',
      request: 'purple',
      approval: 'green'
    };
    return colorMap[type as keyof typeof colorMap] || 'blue';
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>En vivo</span>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {(['all', 'unread', 'today'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      filter === filterOption
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filterOption === 'all' ? 'Todas' : 
                     filterOption === 'unread' ? 'No leídas' : 'Hoy'}
                  </button>
                ))}
              </div>

              <div className="flex space-x-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    title="Eliminar todas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Configuración</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableBrowserNotifications}
                    onChange={(e) => handleConfigUpdate({ enableBrowserNotifications: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Notificaciones del navegador</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableSoundAlerts}
                    onChange={(e) => handleConfigUpdate({ enableSoundAlerts: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Alertas de sonido</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.autoMarkAsRead}
                    onChange={(e) => handleConfigUpdate({ autoMarkAsRead: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Marcar como leída al ver</span>
                </label>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'unread' ? 'No hay notificaciones sin leer' :
                   filter === 'today' ? 'No hay notificaciones de hoy' :
                   'No hay notificaciones'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        getNotificationColor(notification.type) === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50' :
                        getNotificationColor(notification.type) === 'green' ? 'bg-green-100 dark:bg-green-900/50' :
                        getNotificationColor(notification.type) === 'orange' ? 'bg-orange-100 dark:bg-orange-900/50' :
                        getNotificationColor(notification.type) === 'red' ? 'bg-red-100 dark:bg-red-900/50' :
                        'bg-purple-100 dark:bg-purple-900/50'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              !notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                title="Marcar como leída"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              title="Eliminar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;