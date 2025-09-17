import React, { useState, useEffect } from 'react';
import { Bell, Send, Settings, Trash2, Eye, Filter, Users, MessageSquare } from 'lucide-react';
import { notificationService, Notification, NotificationConfig } from '../../services/notificationService';
import { realtimeService } from '../../services/realtimeService';

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [config, setConfig] = useState<NotificationConfig>(notificationService.getConfig());
  const [activeTab, setActiveTab] = useState<'notifications' | 'send' | 'settings'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | 'today' | 'type'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [stats, setStats] = useState(notificationService.getStats());

  const [sendForm, setSendForm] = useState({
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    title: '',
    message: '',
    userId: '', // Para enviar a usuario específico
    expiresIn: 24 // horas
  });

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((allNotifications) => {
      setNotifications(allNotifications);
      setStats(notificationService.getStats());
    });

    // Suscribirse a actualizaciones en tiempo real
    const unsubscribeRealtime = realtimeService.subscribe('notification', (event) => {
      console.log('🔄 Actualización de notificación en tiempo real:', event);
      // Las notificaciones se actualizarán automáticamente a través del servicio
    });

    return () => {
      unsubscribe();
      unsubscribeRealtime();
    };
  }, []);

  const handleConfigUpdate = (newConfig: Partial<NotificationConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    notificationService.updateConfig(updatedConfig);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + sendForm.expiresIn);

    notificationService.addNotification({
      type: sendForm.type,
      title: sendForm.title,
      message: sendForm.message,
      userId: sendForm.userId || undefined,
      expiresAt: expiresAt.toISOString()
    });

    setSendForm({
      type: 'info',
      title: '',
      message: '',
      userId: '',
      expiresIn: 24
    });

    setShowSendModal(false);
    notificationService.addNotification({
      type: 'success',
      title: 'Notificación Enviada',
      message: 'Notificación enviada exitosamente'
    });
  };

  const handleDeleteNotification = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      notificationService.deleteNotification(id);
    }
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      notificationService.clearAll();
    }
  };

  const sendTestNotifications = () => {
    // Enviar notificaciones de prueba
    notificationService.notifySystemEvent('Prueba de Sistema', 'Esta es una notificación de prueba del sistema', 'info');
    notificationService.notifySystemEvent('Prueba Exitosa', 'Operación completada correctamente', 'success');
    notificationService.notifySystemEvent('Advertencia de Prueba', 'Esta es una advertencia de prueba', 'warning');
    notificationService.notifyPrinterStatus('Impresora Principal', 'connected');
    
    notificationService.addNotification({
      type: 'success',
      title: 'Pruebas Enviadas',
      message: 'Notificaciones de prueba enviadas'
    });
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
      case 'type':
        if (typeFilter !== 'all') {
          filtered = notifications.filter(n => n.type === typeFilter);
        }
        break;
    }

    return filtered;
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

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Notificaciones</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Administra las notificaciones del sistema</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            🔄 Actualizaciones automáticas en tiempo real
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['notifications', 'send', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'notifications' ? 'Notificaciones' :
                 tab === 'send' ? 'Enviar' : 'Configuración'}
              </button>
            ))}
          </div>
          
          <button
            onClick={sendTestNotifications}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Pruebas</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin Leer</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.unread}</p>
            </div>
            <Eye className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hoy</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.today}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Solicitudes</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.byType.request || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              {(['all', 'unread', 'today', 'type'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filterOption === 'all' ? 'Todas' :
                   filterOption === 'unread' ? 'Sin leer' :
                   filterOption === 'today' ? 'Hoy' : 'Por tipo'}
                </button>
              ))}
            </div>
            
            {filter === 'type' && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Todos los tipos</option>
                <option value="info">Información</option>
                <option value="success">Éxito</option>
                <option value="warning">Advertencia</option>
                <option value="error">Error</option>
                <option value="request">Solicitud</option>
                <option value="approval">Aprobación</option>
              </select>
            )}
            
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-1 px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpiar todo</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No hay notificaciones</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border border-gray-200 dark:border-gray-700 ${
                    notification.type === 'info' ? 'border-l-blue-400' :
                    notification.type === 'success' ? 'border-l-green-400' :
                    notification.type === 'warning' ? 'border-l-orange-400' :
                    notification.type === 'error' ? 'border-l-red-400' :
                    notification.type === 'request' ? 'border-l-purple-400' :
                    'border-l-green-400'
                  } ${!notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{notification.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.userId && (
                            <span>Usuario: {notification.userId}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            notification.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                            notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            notification.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                            notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                            notification.type === 'request' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' :
                            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          }`}>
                            {notification.type}
                          </span>
                          {!notification.isRead && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full text-xs">
                              Sin leer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Enviar Nueva Notificación</h3>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Notificación
                </label>
                <select
                  value={sendForm.type}
                  onChange={(e) => setSendForm({...sendForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="info">Información</option>
                  <option value="success">Éxito</option>
                  <option value="warning">Advertencia</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usuario Específico (opcional)
                </label>
                <select
                  value={sendForm.userId}
                  onChange={(e) => setSendForm({...sendForm, userId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todos los usuarios</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título
              </label>
              <input
                type="text"
                value={sendForm.title}
                onChange={(e) => setSendForm({...sendForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Título de la notificación"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mensaje
              </label>
              <textarea
                value={sendForm.message}
                onChange={(e) => setSendForm({...sendForm, message: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Contenido del mensaje"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expira en (horas)
              </label>
              <input
                type="number"
                value={sendForm.expiresIn}
                onChange={(e) => setSendForm({...sendForm, expiresIn: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="1"
                max="168"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Notificación</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración de Notificaciones</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Notificaciones del Navegador</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mostrar notificaciones en el navegador</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableBrowserNotifications}
                  onChange={(e) => handleConfigUpdate({ enableBrowserNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Alertas de Sonido</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reproducir sonido al recibir notificaciones</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableSoundAlerts}
                  onChange={(e) => handleConfigUpdate({ enableSoundAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Marcar como Leída Automáticamente</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Marcar notificaciones como leídas al verlas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoMarkAsRead}
                  onChange={(e) => handleConfigUpdate({ autoMarkAsRead: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración de Notificaciones (segundos)
              </label>
              <input
                type="number"
                value={config.notificationDuration}
                onChange={(e) => handleConfigUpdate({ notificationDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="1"
                max="30"
              />
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Tipos de Notificaciones Habilitadas</h4>
              <div className="space-y-2">
                {['info', 'success', 'warning', 'error', 'request', 'approval'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enabledTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...config.enabledTypes, type]
                          : config.enabledTypes.filter(t => t !== type);
                        handleConfigUpdate({ enabledTypes: newTypes });
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;