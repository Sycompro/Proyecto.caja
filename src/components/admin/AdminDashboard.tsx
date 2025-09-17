import React, { useState } from 'react';
import { Users, FileText, TrendingUp, Clock, Printer, Bell, Palette, Settings, Camera, Building, Menu, X, ChevronRight, MessageSquare } from 'lucide-react';
import UserManagement from './UserManagement';
import RequestsManagement from './RequestsManagement';
import PrinterManagement from './PrinterManagement';
import NotificationManagement from './NotificationManagement';
import ThemeConfiguration from './ThemeConfiguration';
import PrintContentConfiguration from './PrintContentConfiguration';
import CameraMonitoring from './CameraMonitoring';
import SystemConfiguration from './SystemConfiguration';
import ChatManagement from './ChatManagement';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'requests' | 'printers' | 'notifications' | 'themes' | 'print-config' | 'cameras' | 'system' | 'chat'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp, color: 'from-blue-500 to-blue-600', description: 'Vista general del sistema' },
    { id: 'users', label: 'Usuarios', icon: Users, color: 'from-green-500 to-green-600', description: 'Gestión de usuarios' },
    { id: 'requests', label: 'Solicitudes', icon: FileText, color: 'from-purple-500 to-purple-600', description: 'Administración de solicitudes' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'from-pink-500 to-pink-600', description: 'Gestión del sistema de chat' },
    { id: 'cameras', label: 'Cámaras', icon: Camera, color: 'from-indigo-500 to-indigo-600', description: 'Monitoreo por cámara IP' },
    { id: 'printers', label: 'Impresoras', icon: Printer, color: 'from-orange-500 to-orange-600', description: 'Configuración de impresoras' },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, color: 'from-pink-500 to-pink-600', description: 'Centro de notificaciones' },
    { id: 'themes', label: 'Temas', icon: Palette, color: 'from-cyan-500 to-cyan-600', description: 'Personalización de temas' },
    { id: 'print-config', label: 'Impresión', icon: Settings, color: 'from-gray-500 to-gray-600', description: 'Configuración de impresión' },
    { id: 'system', label: 'Sistema', icon: Building, color: 'from-red-500 to-red-600', description: 'Configuración del sistema' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'requests':
        return <RequestsManagement />;
      case 'chat':
        return <ChatManagement />;
      case 'cameras':
        return <CameraMonitoring />;
      case 'printers':
        return <PrinterManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'themes':
        return <ThemeConfiguration />;
      case 'print-config':
        return <PrintContentConfiguration />;
      case 'system':
        return <SystemConfiguration />;
      default:
        return <DashboardOverview />;
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    setSidebarOpen(false); // Cerrar sidebar en móvil al seleccionar
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar Desktop - ÚNICA BARRA DE NAVEGACIÓN */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {/* Sidebar Header */}
            <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Panel Admin
              </h2>
            </div>

            {/* Navigation - ÚNICA NAVEGACIÓN */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full group relative flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'text-white shadow-lg transform scale-[1.02]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {isActive && (
                      <div 
                        className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-xl`}
                      />
                    )}
                    
                    <div className="relative flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium block truncate ${isActive ? 'text-white' : ''}`}>
                          {tab.label}
                        </span>
                        <span className={`text-xs block truncate ${
                          isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          {tab.description}
                        </span>
                      </div>
                      {isActive && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Sistema Actualizado</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Todas las funciones están operativas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar - ÚNICA BARRA MÓVIL */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Panel Admin
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation - ÚNICA NAVEGACIÓN MÓVIL */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full group relative flex items-center px-3 py-3 text-left rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {isActive && (
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-xl`}
                  />
                )}
                
                <div className="relative flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium block truncate ${isActive ? 'text-white' : ''}`}>
                      {tab.label}
                    </span>
                    <span className={`text-xs block truncate ${
                      isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      {tab.description}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header Bar - SIN DUPLICAR NAVEGACIÓN */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Botón hamburguesa SOLO para móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Información de la sección actual */}
            {activeTabData && (
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${activeTabData.color} flex-shrink-0`}>
                  <activeTabData.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {activeTabData.label}
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {activeTabData.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Indicador de estado del sistema */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="hidden md:inline">Sistema Activo</span>
            </div>
          </div>
        </div>

        {/* Content Area - Área principal de contenido */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-4 lg:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingRequests: 0,
    totalRequests: 0,
    totalPrinters: 0,
    activePrinters: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    activeCameras: 0,
    activeSessions: 0
  });

  React.useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const requests = JSON.parse(localStorage.getItem('printRequests') || '[]');
    const printers = JSON.parse(localStorage.getItem('printers') || '[]');
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const cameras = JSON.parse(localStorage.getItem('cameras') || '[]');
    const activeSessions = JSON.parse(localStorage.getItem('activeCameraSessions') || '[]');

    setStats({
      totalUsers: users.length,
      activeUsers: users.filter((u: any) => u.isActive).length,
      pendingRequests: requests.filter((r: any) => r.status === 'pending').length,
      totalRequests: requests.length,
      totalPrinters: printers.length,
      activePrinters: printers.filter((p: any) => p.isActive).length,
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter((n: any) => !n.isRead).length,
      activeCameras: cameras.filter((c: any) => c.isActive).length,
      activeSessions: activeSessions.length
    });
  }, []);

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30'
    },
    {
      title: 'Usuarios Activos',
      value: stats.activeUsers,
      icon: Users,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      bgColor: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30'
    },
    {
      title: 'Solicitudes Pendientes',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      change: stats.pendingRequests > 0 ? 'Requiere atención' : 'Al día',
      bgColor: 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30'
    },
    {
      title: 'Total Solicitudes',
      value: stats.totalRequests,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      change: '+24%',
      bgColor: 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30'
    },
    {
      title: 'Cámaras Activas',
      value: stats.activeCameras,
      icon: Camera,
      color: 'from-indigo-500 to-indigo-600',
      change: `${stats.activeSessions} sesiones`,
      bgColor: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30'
    },
    {
      title: 'Impresoras Activas',
      value: stats.activePrinters,
      icon: Printer,
      color: 'from-teal-500 to-teal-600',
      change: `${stats.totalPrinters} total`,
      bgColor: 'from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30'
    },
    {
      title: 'Notificaciones',
      value: stats.unreadNotifications,
      icon: Bell,
      color: 'from-pink-500 to-pink-600',
      change: `${stats.totalNotifications} total`,
      bgColor: 'from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30'
    }
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">¡Bienvenido al Panel de Administración!</h2>
          <p className="text-blue-100 text-base lg:text-lg">Gestiona tu sistema de caja registradora desde aquí</p>
          <div className="mt-4 lg:mt-6 flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sistema Operativo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Tiempo Real Activo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Chat Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
              <span>WhatsApp Configurado</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 lg:w-64 h-32 lg:h-64 bg-white/5 rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-24 lg:w-48 h-24 lg:h-48 bg-white/5 rounded-full translate-y-12 lg:translate-y-24 -translate-x-12 lg:-translate-x-24"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={index} 
              className={`bg-gradient-to-br ${card.bgColor} rounded-2xl p-4 lg:p-6 border border-white/20 dark:border-gray-700/20 hover:transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className={`p-2 lg:p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg flex-shrink-0`}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-right min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">{card.value}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">{card.title}</p>
                <p className={`text-xs font-medium truncate ${
                  card.color.includes('orange') && stats.pendingRequests > 0 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {card.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity and Status Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Actividad Reciente</span>
          </h3>
          <div className="space-y-3 lg:space-y-4">
            {[
              { icon: '🟢', text: 'Sistema iniciado correctamente', time: 'Hace 2 minutos', color: 'green' },
              { icon: '🔵', text: 'Nueva solicitud recibida', time: 'Hace 5 minutos', color: 'blue' },
              { icon: '💬', text: 'Nuevo mensaje en chat general', time: 'Hace 8 minutos', color: 'purple' },
              { icon: '🟣', text: 'Sesión de cámara iniciada', time: 'Hace 10 minutos', color: 'purple' },
              { icon: '🟢', text: 'Solicitud aprobada e impresa', time: 'Hace 15 minutos', color: 'green' }
            ].map((activity, index) => (
              <div key={index} className={`flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-xl bg-gradient-to-r ${
                activity.color === 'green' ? 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20' :
                activity.color === 'blue' ? 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20' :
                'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20'
              } border border-white/50 dark:border-gray-700/50`}>
                <div className="text-xl lg:text-2xl flex-shrink-0">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm lg:text-base truncate">{activity.text}</p>
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Estado del Sistema</span>
          </h3>
          <div className="space-y-3 lg:space-y-4">
            {[
              { label: 'Caja Registradora', status: 'Conectada', color: 'green', icon: '💰' },
              { label: 'Impresoras', status: `${stats.activePrinters} Activas`, color: 'green', icon: '🖨️' },
              { label: 'Cámaras IP', status: `${stats.activeCameras} Activas`, color: 'green', icon: '📹' },
              { label: 'Chat del Sistema', status: 'Funcionando', color: 'green', icon: '💬' },
              { label: 'WhatsApp API', status: 'Configurado', color: 'green', icon: '📱' },
              { label: 'Sistema', status: 'Funcionando', color: 'green', icon: '⚙️' },
              { label: 'Sesiones Activas', status: `${stats.activeSessions} En curso`, color: 'blue', icon: '👥' },
              { label: 'Notificaciones', status: `${stats.unreadNotifications} Sin leer`, color: 'blue', icon: '🔔' }
            ].map((item, index) => (
              <div key={index} className={`flex items-center justify-between p-3 lg:p-4 rounded-xl bg-gradient-to-r ${
                item.color === 'green' ? 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20' :
                'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20'
              } border border-white/50 dark:border-gray-700/50`}>
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                  <span className="text-lg lg:text-xl flex-shrink-0">{item.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm lg:text-base truncate">{item.label}</span>
                </div>
                <span className={`font-semibold text-sm lg:text-base flex-shrink-0 ${
                  item.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;