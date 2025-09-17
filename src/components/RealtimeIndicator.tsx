import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Settings, Activity, Pause, Play } from 'lucide-react';
import { realtimeService, RealtimeEvent, RealtimeConfig } from '../services/realtimeService';

const RealtimeIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [config, setConfig] = useState<RealtimeConfig>(realtimeService.getConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState(realtimeService.getStats());
  const [lastActivity, setLastActivity] = useState<string>('');

  useEffect(() => {
    // Suscribirse a todos los eventos para mostrar actividad
    const unsubscribe = realtimeService.subscribeToAll((event: RealtimeEvent) => {
      setLastActivity(`${event.type}: ${event.action}`);
      setIsConnected(true);
      
      // Actualizar estadísticas
      setStats(realtimeService.getStats());
    });

    // Actualizar estadísticas cada 5 segundos
    const statsInterval = setInterval(() => {
      setStats(realtimeService.getStats());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  const handleConfigUpdate = (newConfig: Partial<RealtimeConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    realtimeService.updateConfig(updatedConfig);
  };

  const toggleRealtime = () => {
    handleConfigUpdate({ enabled: !config.enabled });
  };

  const forceUpdate = () => {
    realtimeService.forceUpdate();
    setLastActivity('Actualización forzada');
  };

  return (
    <div className="relative">
      {/* Indicador Principal */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
          config.enabled && isConnected
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
        }`}
        title={`Tiempo Real: ${config.enabled ? 'Activo' : 'Inactivo'}`}
      >
        {config.enabled && isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium hidden sm:inline">
          {config.enabled ? 'En Vivo' : 'Pausado'}
        </span>
        {config.enabled && (
          <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
        )}
      </button>

      {/* Panel de Configuración */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSettings(false)}
          ></div>
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Tiempo Real</span>
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Estado Actual */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                  <span className={`text-sm font-semibold ${
                    config.enabled && stats.isActive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {config.enabled && stats.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Polls activos:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stats.activePolls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Última actividad:</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                    {lastActivity || 'Ninguna'}
                  </span>
                </div>
              </div>

              {/* Controles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Actualizaciones automáticas
                  </span>
                  <button
                    onClick={toggleRealtime}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                      config.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {config.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span className="text-xs">{config.enabled ? 'Pausar' : 'Iniciar'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Intervalo de actualización: {config.pollInterval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="1000"
                    value={config.pollInterval}
                    onChange={(e) => handleConfigUpdate({ pollInterval: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>1s</span>
                    <span>5s</span>
                    <span>10s</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipos de eventos:
                  </span>
                  {['notification', 'request', 'user', 'printer', 'system'].map((eventType) => (
                    <label key={eventType} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.enabledEvents.includes(eventType)}
                        onChange={(e) => {
                          const newEvents = e.target.checked
                            ? [...config.enabledEvents, eventType]
                            : config.enabledEvents.filter(t => t !== eventType);
                          handleConfigUpdate({ enabledEvents: newEvents });
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {eventType === 'notification' ? 'Notificaciones' :
                         eventType === 'request' ? 'Solicitudes' :
                         eventType === 'user' ? 'Usuarios' :
                         eventType === 'printer' ? 'Impresoras' : 'Sistema'}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enableVisualIndicator}
                      onChange={(e) => handleConfigUpdate({ enableVisualIndicator: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Indicadores visuales
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enableSoundNotifications}
                      onChange={(e) => handleConfigUpdate({ enableSoundNotifications: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Sonidos de notificación
                    </span>
                  </label>
                </div>

                <button
                  onClick={forceUpdate}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Forzar Actualización
                </button>
              </div>

              {/* Información de Debug */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <details className="text-xs text-gray-500 dark:text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    Información técnica
                  </summary>
                  <div className="mt-2 space-y-1">
                    <div>Polls activos: {stats.activePolls}</div>
                    <div>Pestaña activa: {stats.isActive ? 'Sí' : 'No'}</div>
                    <div>Intervalo: {config.pollInterval}ms</div>
                    <div>Eventos: {config.enabledEvents.join(', ')}</div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RealtimeIndicator;