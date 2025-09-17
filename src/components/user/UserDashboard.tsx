import React, { useState, useEffect } from 'react';
import { Send, Clock, Check, X, DollarSign, FileText, Plus } from 'lucide-react';
import { PrintRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { whatsappService } from '../../services/whatsappService';
import { notificationService } from '../../services/notificationService';
import { realtimeService } from '../../services/realtimeService';

const UserDashboard: React.FC = () => {
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    amount: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    loadRequests();
    
    // Suscribirse a actualizaciones en tiempo real
    const unsubscribe = realtimeService.subscribe('request', (event) => {
      console.log('🔄 Actualización de solicitud en tiempo real:', event);
      // Solo actualizar si es una solicitud del usuario actual
      if (!event.data.userId || event.data.userId === user?.id) {
        loadRequests();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const loadRequests = () => {
    const storedRequests = JSON.parse(localStorage.getItem('printRequests') || '[]');
    const userRequests = storedRequests
      .filter((req: PrintRequest) => req.userId === user?.id)
      .sort((a: PrintRequest, b: PrintRequest) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    setRequests(userRequests);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRequest: PrintRequest = {
      id: Date.now().toString(),
      userId: user!.id,
      userName: user!.fullName,
      reason: formData.reason,
      amount: parseFloat(formData.amount),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const storedRequests = JSON.parse(localStorage.getItem('printRequests') || '[]');
    storedRequests.push(newRequest);
    localStorage.setItem('printRequests', JSON.stringify(storedRequests));

    // Enviar notificación de WhatsApp al admin
    try {
      await whatsappService.sendNewRequestNotification({
        requestId: newRequest.id,
        userName: newRequest.userName,
        amount: newRequest.amount,
        reason: newRequest.reason,
        createdAt: newRequest.createdAt
      });
    } catch (error) {
      console.error('Error al enviar notificación de WhatsApp al admin:', error);
    }

    // Enviar notificación al sistema
    notificationService.notifyNewRequest({
      id: newRequest.id,
      userName: newRequest.userName,
      amount: newRequest.amount
    });

    // Notificación personal al usuario
    notificationService.addNotification({
      type: 'info',
      title: 'Solicitud Enviada',
      message: `Tu solicitud de $${newRequest.amount.toFixed(2)} ha sido enviada y está pendiente de aprobación`,
      userId: user?.id
    });

    setFormData({ reason: '', amount: '' });
    setShowModal(false);
    loadRequests();

    // Mostrar confirmación al usuario
    setTimeout(() => {
      notificationService.addNotification({
        type: 'success',
        title: '✅ Solicitud Enviada',
        message: '📱 El administrador ha sido notificado por WhatsApp'
      });
    }, 500);
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const recentRequests = requests.slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Mi Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Gestiona tus solicitudes de apertura de caja</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>🔄 Actualizaciones automáticas en tiempo real</span>
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 flex items-center space-x-1">
              <span>📱 Notificaciones WhatsApp automáticas al admin</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Solicitud</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 sm:p-6 shadow-lg border border-white/20 dark:border-gray-700/20 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Solicitudes Pendientes</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{pendingRequests.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-full flex-shrink-0 ml-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 sm:p-6 shadow-lg border border-white/20 dark:border-gray-700/20 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Solicitudes</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{requests.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-full flex-shrink-0 ml-3">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 sm:p-6 shadow-lg border border-white/20 dark:border-gray-700/20 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Aprobadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {requests.filter(req => req.status === 'approved').length}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full flex-shrink-0 ml-3">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20">
        <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Mis Solicitudes Recientes
          </h2>
        </div>
        
        <div className="p-4 sm:p-6">
          {recentRequests.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No tienes solicitudes aún</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Crea tu primera solicitud para abrir la caja</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    request.status === 'pending' ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/30 dark:to-orange-800/30' :
                    request.status === 'approved' ? 'border-green-400 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/30' :
                    'border-red-400 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/30'
                  } backdrop-blur border-opacity-50`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                          request.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/50' :
                          request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                        }`}>
                          {request.status === 'pending' ? <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" /> :
                           request.status === 'approved' ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> :
                           <X className="w-3 h-3 text-red-600 dark:text-red-400" />}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          Solicitud #{request.id.slice(-6)}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                          request.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-400' :
                          request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400' :
                          'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-400'
                        }`}>
                          {request.status === 'pending' ? 'Pendiente' :
                           request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Monto: <strong className="text-gray-900 dark:text-gray-100">${request.amount.toFixed(2)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {new Date(request.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur p-3 rounded border border-gray-200/30 dark:border-gray-700/30">
                          <strong>Motivo:</strong> {request.reason}
                        </p>
                      </div>

                      {request.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 backdrop-blur p-2 rounded border border-gray-200/30 dark:border-gray-700/30">
                          <strong>Notas del admin:</strong> {request.notes}
                        </p>
                      )}

                      {request.processedAt && (
                        <div className="mt-3 p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Procesado por:</strong> {request.processedBy}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Fecha:</strong> {new Date(request.processedAt).toLocaleString()}
                          </p>
                          {request.status === 'approved' && (
                            <div className="mt-2 space-y-1">
                              <p className="text-green-600 dark:text-green-400 font-medium text-sm">✅ Documento generado e impreso</p>
                              <p className="text-green-600 dark:text-green-400 font-medium text-sm">📱 Gerente notificado por WhatsApp</p>
                            </div>
                          )}
                          {request.status === 'rejected' && (
                            <div className="mt-2">
                              <p className="text-red-600 dark:text-red-400 font-medium text-sm">📱 Gerente notificado del rechazo por WhatsApp</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/20">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Nueva Solicitud de Apertura de Caja
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto a registrar
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de la apertura
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Describe el motivo para abrir la caja registradora..."
                  required
                />
              </div>

              <div className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur p-3 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>📱 Nota:</strong> El administrador será notificado automáticamente por WhatsApp cuando envíes esta solicitud.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ reason: '', amount: '' });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur rounded-lg hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;