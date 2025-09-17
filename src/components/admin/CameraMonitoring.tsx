import React, { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Settings, Monitor, Users, Play, Pause, RotateCcw, Maximize2, Volume2, VolumeX, SwordIcon as Record, Square } from 'lucide-react';
import { PrintRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface CameraConfig {
  enabled: boolean;
  cameras: CameraDevice[];
  autoRecord: boolean;
  recordDuration: number; // en segundos
  showOnApproval: boolean;
  enableAudio: boolean;
  quality: 'low' | 'medium' | 'high';
}

interface CameraDevice {
  id: string;
  name: string;
  url: string;
  location: string;
  isActive: boolean;
  type: 'ip' | 'usb' | 'rtsp';
  username?: string;
  password?: string;
}

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  requestId: string;
  startTime: string;
  endTime?: string;
  cameraId: string;
  recordings: string[];
  status: 'active' | 'completed';
  amount: number;
  location: string;
}

const CameraMonitoring: React.FC = () => {
  const [config, setConfig] = useState<CameraConfig>(loadConfig());
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<UserSession[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<Record<string, boolean>>({});
  const [showCameraConfig, setShowCameraConfig] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'sessions' | 'history'>('live');
  const { user } = useAuth();

  useEffect(() => {
    loadCameras();
    loadSessions();
    
    // Limpiar sesiones antiguas cada minuto
    const cleanupInterval = setInterval(cleanupOldSessions, 60000);
    
    return () => clearInterval(cleanupInterval);
  }, []);

  function loadConfig(): CameraConfig {
    const stored = localStorage.getItem('cameraConfig');
    return stored ? JSON.parse(stored) : {
      enabled: false,
      cameras: [],
      autoRecord: true,
      recordDuration: 300, // 5 minutos
      showOnApproval: true,
      enableAudio: false,
      quality: 'medium'
    };
  }

  const saveConfig = (newConfig: CameraConfig) => {
    setConfig(newConfig);
    localStorage.setItem('cameraConfig', JSON.stringify(newConfig));
  };

  const loadCameras = () => {
    const stored = localStorage.getItem('cameras');
    const cameraList = stored ? JSON.parse(stored) : [];
    setCameras(cameraList);
  };

  const loadSessions = () => {
    const activeSessions = JSON.parse(localStorage.getItem('activeCameraSessions') || '[]');
    const completedSessions = JSON.parse(localStorage.getItem('completedCameraSessions') || '[]');
    setActiveSessions(activeSessions);
    setCompletedSessions(completedSessions);
  };

  const saveSessions = (active: UserSession[], completed: UserSession[]) => {
    localStorage.setItem('activeCameraSessions', JSON.stringify(active));
    localStorage.setItem('completedCameraSessions', JSON.stringify(completed));
    setActiveSessions(active);
    setCompletedSessions(completed);
  };

  const addCamera = (camera: Omit<CameraDevice, 'id'>) => {
    const newCamera: CameraDevice = {
      ...camera,
      id: Date.now().toString()
    };
    
    const updatedCameras = [...cameras, newCamera];
    setCameras(updatedCameras);
    localStorage.setItem('cameras', JSON.stringify(updatedCameras));
  };

  const updateCamera = (id: string, updates: Partial<CameraDevice>) => {
    const updatedCameras = cameras.map(cam => 
      cam.id === id ? { ...cam, ...updates } : cam
    );
    setCameras(updatedCameras);
    localStorage.setItem('cameras', JSON.stringify(updatedCameras));
  };

  const deleteCamera = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cámara?')) {
      const updatedCameras = cameras.filter(cam => cam.id !== id);
      setCameras(updatedCameras);
      localStorage.setItem('cameras', JSON.stringify(updatedCameras));
    }
  };

  const startUserSession = (request: PrintRequest, cameraId: string) => {
    const session: UserSession = {
      id: Date.now().toString(),
      userId: request.userId,
      userName: request.userName,
      requestId: request.id,
      startTime: new Date().toISOString(),
      cameraId,
      recordings: [],
      status: 'active',
      amount: request.amount,
      location: cameras.find(c => c.id === cameraId)?.location || 'Desconocida'
    };

    const newActiveSessions = [...activeSessions, session];
    saveSessions(newActiveSessions, completedSessions);

    // Auto-iniciar grabación si está habilitado
    if (config.autoRecord) {
      startRecording(cameraId, session.id);
    }

    return session.id;
  };

  const endUserSession = (sessionId: string) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const completedSession: UserSession = {
      ...session,
      endTime: new Date().toISOString(),
      status: 'completed'
    };

    const newActiveSessions = activeSessions.filter(s => s.id !== sessionId);
    const newCompletedSessions = [...completedSessions, completedSession];
    
    saveSessions(newActiveSessions, newCompletedSessions);

    // Detener grabación si está activa
    if (isRecording[session.cameraId]) {
      stopRecording(session.cameraId);
    }
  };

  const startRecording = (cameraId: string, sessionId?: string) => {
    setIsRecording(prev => ({ ...prev, [cameraId]: true }));
    
    // Simular grabación (en un sistema real, aquí se iniciaría la grabación real)
    const recordingId = `recording_${Date.now()}`;
    
    // Detener automáticamente después del tiempo configurado
    setTimeout(() => {
      stopRecording(cameraId);
      
      // Agregar grabación a la sesión si existe
      if (sessionId) {
        const session = activeSessions.find(s => s.id === sessionId);
        if (session) {
          session.recordings.push(recordingId);
          saveSessions(activeSessions, completedSessions);
        }
      }
    }, config.recordDuration * 1000);
  };

  const stopRecording = (cameraId: string) => {
    setIsRecording(prev => ({ ...prev, [cameraId]: false }));
  };

  const cleanupOldSessions = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredCompleted = completedSessions.filter(session => 
      new Date(session.endTime || session.startTime) > oneDayAgo
    );
    
    if (filteredCompleted.length !== completedSessions.length) {
      saveSessions(activeSessions, filteredCompleted);
    }
  };

  // Función para ser llamada cuando se aprueba una solicitud
  const onRequestApproved = (request: PrintRequest) => {
    if (!config.enabled || !config.showOnApproval) return;

    const userCamera = cameras.find(cam => 
      cam.isActive && cam.location.toLowerCase().includes(request.userName.toLowerCase())
    ) || cameras.find(cam => cam.isActive);

    if (userCamera) {
      const sessionId = startUserSession(request, userCamera.id);
      setSelectedCamera(userCamera.id);
      setActiveTab('live');
      
      // Auto-finalizar sesión después de un tiempo
      setTimeout(() => {
        endUserSession(sessionId);
      }, config.recordDuration * 1000);
    }
  };

  const getSessionDuration = (session: UserSession) => {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!config.enabled) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Monitoreo por Cámara Deshabilitado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            El sistema de monitoreo por cámara IP está deshabilitado. Habilítalo para supervisar las actividades de los usuarios.
          </p>
          <button
            onClick={() => saveConfig({ ...config, enabled: true })}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Habilitar Monitoreo por Cámara
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monitoreo por Cámara IP</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Supervisa las actividades de los usuarios en tiempo real
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 dark:text-green-400">
                {cameras.filter(c => c.isActive).length} cámaras activas
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400">
                {activeSessions.length} sesiones activas
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCameraConfig(true)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'live', label: 'Monitoreo en Vivo', icon: Monitor },
            { id: 'sessions', label: 'Sesiones Activas', icon: Users },
            { id: 'history', label: 'Historial', icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Cámaras Disponibles</h3>
              <div className="space-y-3">
                {cameras.filter(cam => cam.isActive).map((camera) => (
                  <div
                    key={camera.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCamera === camera.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedCamera(camera.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{camera.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{camera.location}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isRecording[camera.id] && (
                          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                            <Record className="w-3 h-3" />
                            <span className="text-xs">REC</span>
                          </div>
                        )}
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {cameras.filter(cam => cam.isActive).length === 0 && (
                  <div className="text-center py-6">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No hay cámaras activas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              {selectedCamera ? (
                <CameraFeed 
                  camera={cameras.find(c => c.id === selectedCamera)!}
                  isRecording={isRecording[selectedCamera]}
                  onStartRecording={() => startRecording(selectedCamera)}
                  onStopRecording={() => stopRecording(selectedCamera)}
                  config={config}
                />
              ) : (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Selecciona una cámara para ver el feed en vivo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sesiones Activas</h3>
          {activeSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay sesiones activas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((session) => (
                <SessionCard 
                  key={session.id}
                  session={session}
                  camera={cameras.find(c => c.id === session.cameraId)}
                  onEndSession={() => endUserSession(session.id)}
                  onViewDetails={() => setShowSessionDetails(session.id)}
                  getDuration={getSessionDuration}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Historial de Sesiones</h3>
          {completedSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay sesiones completadas</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Solicitud
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {completedSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {session.userName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            #{session.requestId.slice(-6)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${session.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {session.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {getSessionDuration(session)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.startTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setShowSessionDetails(session.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Configuration Modal */}
      {showCameraConfig && (
        <CameraConfigModal
          config={config}
          cameras={cameras}
          onSaveConfig={saveConfig}
          onAddCamera={addCamera}
          onUpdateCamera={updateCamera}
          onDeleteCamera={deleteCamera}
          onClose={() => setShowCameraConfig(false)}
        />
      )}

      {/* Session Details Modal */}
      {showSessionDetails && (
        <SessionDetailsModal
          session={[...activeSessions, ...completedSessions].find(s => s.id === showSessionDetails)!}
          camera={cameras.find(c => c.id === [...activeSessions, ...completedSessions].find(s => s.id === showSessionDetails)?.cameraId)}
          onClose={() => setShowSessionDetails(null)}
        />
      )}
    </div>
  );
};

// Componente para mostrar el feed de la cámara
const CameraFeed: React.FC<{
  camera: CameraDevice;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  config: CameraConfig;
}> = ({ camera, isRecording, onStartRecording, onStopRecording, config }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(config.enableAudio);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{camera.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{camera.location}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              audioEnabled 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Record className="w-4 h-4" />}
            <span>{isRecording ? 'Detener' : 'Grabar'}</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'aspect-video'} bg-gray-900 rounded-lg overflow-hidden`}>
        {/* Simulación del feed de cámara */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Feed de Cámara IP</p>
            <p className="text-sm opacity-75">{camera.url}</p>
            <p className="text-xs opacity-50 mt-2">
              Calidad: {config.quality} | Audio: {audioEnabled ? 'ON' : 'OFF'}
            </p>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">GRABANDO</span>
          </div>
        )}

        {/* Fullscreen Controls */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 backdrop-blur px-4 py-2 rounded-lg">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording ? 'text-red-400 hover:bg-red-400/20' : 'text-green-400 hover:bg-green-400/20'
              }`}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Record className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para tarjeta de sesión
const SessionCard: React.FC<{
  session: UserSession;
  camera?: CameraDevice;
  onEndSession: () => void;
  onViewDetails: () => void;
  getDuration: (session: UserSession) => string;
}> = ({ session, camera, onEndSession, onViewDetails, getDuration }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{session.userName}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">#{session.requestId.slice(-6)}</p>
        </div>
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">ACTIVA</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Ubicación:</span>
          <span className="text-gray-900 dark:text-gray-100">{session.location}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Monto:</span>
          <span className="text-gray-900 dark:text-gray-100">${session.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Duración:</span>
          <span className="text-gray-900 dark:text-gray-100">{getDuration(session)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Cámara:</span>
          <span className="text-gray-900 dark:text-gray-100">{camera?.name || 'N/A'}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onViewDetails}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Ver Detalles
        </button>
        <button
          onClick={onEndSession}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Finalizar
        </button>
      </div>
    </div>
  );
};

// Modal de configuración de cámaras
const CameraConfigModal: React.FC<{
  config: CameraConfig;
  cameras: CameraDevice[];
  onSaveConfig: (config: CameraConfig) => void;
  onAddCamera: (camera: Omit<CameraDevice, 'id'>) => void;
  onUpdateCamera: (id: string, updates: Partial<CameraDevice>) => void;
  onDeleteCamera: (id: string) => void;
  onClose: () => void;
}> = ({ config, cameras, onSaveConfig, onAddCamera, onUpdateCamera, onDeleteCamera, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'cameras'>('general');
  const [newCamera, setNewCamera] = useState<Omit<CameraDevice, 'id'>>({
    name: '',
    url: '',
    location: '',
    isActive: true,
    type: 'ip'
  });

  const handleAddCamera = () => {
    if (newCamera.name && newCamera.url && newCamera.location) {
      onAddCamera(newCamera);
      setNewCamera({
        name: '',
        url: '',
        location: '',
        isActive: true,
        type: 'ip'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Configuración de Cámaras
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'general', label: 'Configuración General' },
              { id: 'cameras', label: 'Gestión de Cámaras' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => onSaveConfig({ ...config, enabled: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Habilitar monitoreo por cámara
                  </span>
                </label>

                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={config.autoRecord}
                    onChange={(e) => onSaveConfig({ ...config, autoRecord: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Grabación automática
                  </span>
                </label>

                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={config.showOnApproval}
                    onChange={(e) => onSaveConfig({ ...config, showOnApproval: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mostrar cámara al aprobar solicitud
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableAudio}
                    onChange={(e) => onSaveConfig({ ...config, enableAudio: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Habilitar audio
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duración de grabación (segundos)
                  </label>
                  <input
                    type="number"
                    value={config.recordDuration}
                    onChange={(e) => onSaveConfig({ ...config, recordDuration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="30"
                    max="3600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calidad de video
                  </label>
                  <select
                    value={config.quality}
                    onChange={(e) => onSaveConfig({ ...config, quality: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="low">Baja (480p)</option>
                    <option value="medium">Media (720p)</option>
                    <option value="high">Alta (1080p)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cameras' && (
          <div className="space-y-6">
            {/* Add New Camera */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Agregar Nueva Cámara</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Nombre de la cámara"
                  value={newCamera.name}
                  onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="URL de la cámara"
                  value={newCamera.url}
                  onChange={(e) => setNewCamera({ ...newCamera, url: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Ubicación"
                  value={newCamera.location}
                  onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleAddCamera}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Camera List */}
            <div className="space-y-3">
              {cameras.map((camera) => (
                <div key={camera.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">{camera.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{camera.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">URL:</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{camera.url}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tipo: {camera.type.toUpperCase()}</p>
                      <p className={`text-sm ${camera.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {camera.isActive ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateCamera(camera.id, { isActive: !camera.isActive })}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        camera.isActive
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    >
                      {camera.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => onDeleteCamera(camera.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de detalles de sesión
const SessionDetailsModal: React.FC<{
  session: UserSession;
  camera?: CameraDevice;
  onClose: () => void;
}> = ({ session, camera, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Detalles de Sesión
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Información del Usuario</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                  <span className="text-gray-900 dark:text-gray-100">{session.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ID Usuario:</span>
                  <span className="text-gray-900 dark:text-gray-100">{session.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Solicitud:</span>
                  <span className="text-gray-900 dark:text-gray-100">#{session.requestId.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monto:</span>
                  <span className="text-gray-900 dark:text-gray-100">${session.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Información de Sesión</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                  <span className={`font-medium ${
                    session.status === 'active' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {session.status === 'active' ? 'Activa' : 'Completada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ubicación:</span>
                  <span className="text-gray-900 dark:text-gray-100">{session.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cámara:</span>
                  <span className="text-gray-900 dark:text-gray-100">{camera?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Inicio:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {new Date(session.startTime).toLocaleString()}
                  </span>
                </div>
                {session.endTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fin:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(session.endTime).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {session.recordings.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Grabaciones</h4>
              <div className="space-y-2">
                {session.recordings.map((recording, index) => (
                  <div key={recording} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-900 dark:text-gray-100">Grabación {index + 1}</span>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraMonitoring;