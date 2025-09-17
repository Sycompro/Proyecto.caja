import React, { useState, useEffect } from 'react';
import { Check, X, Clock, DollarSign, User, Calendar, FileText, Filter, Settings, Printer } from 'lucide-react';
import { PrintRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { whatsappService } from '../../services/whatsappService';
import { printService, PrinterConfig } from '../../services/printService';
import { notificationService } from '../../services/notificationService';
import { realtimeService } from '../../services/realtimeService';
import WhatsAppConfiguration from './WhatsAppConfiguration';

const RequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const [showPrinterSelect, setShowPrinterSelect] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadRequests();
    loadPrinters();
    
    // Suscribirse a actualizaciones en tiempo real
    const unsubscribeRequests = realtimeService.subscribe('request', (event) => {
      console.log('🔄 Actualización de solicitud en tiempo real:', event);
      loadRequests();
    });

    const unsubscribePrinters = realtimeService.subscribe('printer', (event) => {
      console.log('🔄 Actualización de impresora en tiempo real:', event);
      loadPrinters();
    });

    return () => {
      unsubscribeRequests();
      unsubscribePrinters();
    };
  }, []);

  const loadRequests = () => {
    const storedRequests = JSON.parse(localStorage.getItem('printRequests') || '[]');
    setRequests(storedRequests.sort((a: PrintRequest, b: PrintRequest) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const loadPrinters = () => {
    setPrinters(printService.getAllPrinters());
  };

  const handleApprove = async (requestId: string, notes?: string, printerId?: string) => {
    const storedRequests = JSON.parse(localStorage.getItem('printRequests') || '[]');
    const request = storedRequests.find((req: PrintRequest) => req.id === requestId);
    
    if (!request) return;

    const updatedRequests = storedRequests.map((req: PrintRequest) =>
      req.id === requestId
        ? {
            ...req,
            status: 'approved' as const,
            processedAt: new Date().toISOString(),
            processedBy: user?.fullName,
            notes
          }
        : req
    );
    
    localStorage.setItem('printRequests', JSON.stringify(updatedRequests));
    loadRequests();
    
    // Generar e imprimir documento
    try {
      const documentData = {
        requestId: request.id,
        userName: request.userName,
        amount: request.amount,
        reason: request.reason,
        processedBy: user?.fullName || 'Admin',
        processedAt: new Date().toISOString(),
        companyLogo: localStorage.getItem('companyLogo') || ''
      };

      const printSuccess = await printService.printCashRegisterDocument(documentData, printerId);
      
      if (printSuccess) {
        // Enviar notificación de WhatsApp al gerente
        try {
          await whatsappService.sendApprovalNotification({
            requestId: request.id,
            userName: request.userName,
            amount: request.amount,
            reason: request.reason,
            processedBy: user?.fullName || 'Admin',
            processedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error al enviar notificación de WhatsApp:', error);
        }

        // Enviar notificación al usuario
        notificationService.notifyRequestApproved({
          id: request.id,
          userName: request.userName,
          amount: request.amount,
          processedBy: user?.fullName || 'Admin'
        });

        // Notificación del sistema
        notificationService.notifySystemEvent(
          'Solicitud Aprobada',
          `Solicitud #${request.id.slice(-6)} aprobada e impresa correctamente`,
          'success'
        );
      } else {
        notificationService.notifySystemEvent(
          'Error de Impresión',
          `Problema al imprimir solicitud #${request.id.slice(-6)}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error en el proceso de impresión:', error);
      notificationService.notifySystemEvent(
        'Error de Sistema',
        `Error al procesar solicitud #${request.id.slice(-6)}`,
        'error'
      );
    }
  };

  const handleReject = async (requestId: string, notes?: string) => {
    const storedRequests = JSON.parse(localStorage.getItem('printRequests') || '[]');
    const request = storedRequests.find((req: PrintRequest) => req.id === requestId);
    
    if (!request) return;

    const updatedRequests = storedRequests.map((req: PrintRequest) =>
      req.id === requestId
        ? {
            ...req,
            status: 'rejected' as const,
            processedAt: new Date().toISOString(),
            processedBy: user?.fullName,
            notes
          }
        : req
    );
    
    localStorage.setItem('printRequests', JSON.stringify(updatedRequests));
    loadRequests();

    // Enviar notificación de WhatsApp al gerente sobre el rechazo
    try {
      await whatsappService.sendRejectionNotification({
        requestId: request.id,
        userName: request.userName,
        amount: request.amount,
        reason: notes || 'Sin motivo especificado',
        processedBy: user?.fullName || 'Admin',
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al enviar notificación de rechazo:', error);
    }

    // Enviar notificación al usuario
    notificationService.notifyRequestRejected({
      id: request.id,
      userName: request.userName,
      amount: request.amount,
      reason: notes
    });

    // Notificación del sistema
    notificationService.notifySystemEvent(
      'Solicitud Rechazada',
      `Solicitud #${request.id.slice(-6)} de ${request.userName} ha sido rechazada`,
      'warning'
    );
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(req => req.status === 'pending').length;

  if (showWhatsAppConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowWhatsAppConfig(false)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <X className="w-4 h-4" />
            <span>Volver a Solicitudes</span>
          </button>
        </div>
        <WhatsAppConfiguration />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Solicitudes de Impresión</h2>
          {pendingCount > 0 && (
            <p className="text-orange-600 dark:text-orange-400 font-medium mt-1">
              {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            🔄 Actualizaciones automáticas en tiempo real
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* WhatsApp Config Button */}
          <button
            onClick={() => setShowWhatsAppConfig(true)}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Config WhatsApp</span>
          </button>

          {/* Mobile Filter */}
          <div className="sm:hidden">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </div>

          {/* Desktop Filter */}
          <div className="hidden sm:flex space-x-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption === 'all' ? 'Todas' : 
                 filterOption === 'pending' ? 'Pendientes' :
                 filterOption === 'approved' ? 'Aprobadas' : 'Rechazadas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay solicitudes {filter !== 'all' ? `${filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}` : ''}</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border-l-4 ${
                request.status === 'pending' ? 'border-orange-400' :
                request.status === 'approved' ? 'border-green-400' : 'border-red-400'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      request.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {request.status === 'pending' ? <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" /> :
                       request.status === 'approved' ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> :
                       <X className="w-4 h-4 text-red-600 dark:text-red-400" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Solicitud #{request.id.slice(-6)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full sm:hidden ${
                      request.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                      request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {request.status === 'pending' ? 'Pendiente' :
                       request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        Solicitado por: <strong className="text-gray-900 dark:text-gray-100">{request.userName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Monto: <strong className="text-gray-900 dark:text-gray-100">${request.amount.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Motivo:</p>
                    <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm">
                      {request.reason}
                    </p>
                  </div>

                  {request.processedAt && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p>Procesado por: <strong className="text-gray-900 dark:text-gray-100">{request.processedBy}</strong></p>
                      <p>Fecha: {new Date(request.processedAt).toLocaleString()}</p>
                      {request.notes && (
                        <p className="mt-1">Notas: <em>{request.notes}</em></p>
                      )}
                      {request.status === 'approved' && (
                        <div className="mt-2 space-y-1">
                          <p className="text-green-600 dark:text-green-400 font-medium">✅ Documento generado e impreso</p>
                          <p className="text-green-600 dark:text-green-400 font-medium">📱 Notificación enviada por WhatsApp</p>
                        </div>
                      )}
                      {request.status === 'rejected' && (
                        <div className="mt-2">
                          <p className="text-red-600 dark:text-red-400 font-medium">📱 Notificación de rechazo enviada por WhatsApp</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 xl:space-y-0 xl:space-x-2 lg:ml-4">
                    <button
                      onClick={() => {
                        if (printers.length === 0) {
                          notificationService.addNotification({
                            type: 'warning',
                            title: 'Sin Impresoras',
                            message: 'No hay impresoras configuradas. Ve a la sección de Impresoras para agregar una.'
                          });
                          return;
                        }
                        setShowPrinterSelect(request.id);
                      }}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar</span>
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Motivo del rechazo:');
                        if (notes) handleReject(request.id, notes);
                      }}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                    >
                      <X className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Printer Selection Modal */}
      {showPrinterSelect && (
        <PrinterSelectModal
          requestId={showPrinterSelect}
          printers={printers}
          onApprove={handleApprove}
          onClose={() => setShowPrinterSelect(null)}
        />
      )}
    </div>
  );
};

const PrinterSelectModal: React.FC<{
  requestId: string;
  printers: PrinterConfig[];
  onApprove: (requestId: string, notes?: string, printerId?: string) => void;
  onClose: () => void;
}> = ({ requestId, printers, onApprove, onClose }) => {
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const defaultPrinter = printers.find(p => p.isDefault && p.isActive);
    if (defaultPrinter) {
      setSelectedPrinter(defaultPrinter.id);
    } else if (printers.length > 0) {
      setSelectedPrinter(printers[0].id);
    }
  }, [printers]);

  const handleApprove = () => {
    onApprove(requestId, notes || undefined, selectedPrinter);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
          <Printer className="w-5 h-5 text-green-600" />
          <span>Aprobar Solicitud</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Impresora
            </label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {printers.filter(p => p.isActive).map((printer) => (
                <option key={printer.id} value={printer.id}>
                  {printer.name} {printer.isDefault ? '(Predeterminada)' : ''} - {printer.type} ({printer.paperSize})
                </option>
              ))}
            </select>
            {printers.filter(p => p.isActive).length === 0 && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">No hay impresoras activas disponibles</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Agregar notas sobre la aprobación..."
            />
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>📄 Al aprobar:</strong>
            </p>
            <ul className="text-xs text-green-700 dark:text-green-300 mt-1 space-y-1">
              <li>• Se generará el comprobante de apertura de caja</li>
              <li>• Se enviará automáticamente a la impresora seleccionada</li>
              <li>• Se notificará al gerente por WhatsApp</li>
              <li>• Se enviará notificación al usuario</li>
              <li>• La caja registradora se abrirá</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApprove}
              disabled={!selectedPrinter || printers.filter(p => p.isActive).length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aprobar e Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestsManagement;