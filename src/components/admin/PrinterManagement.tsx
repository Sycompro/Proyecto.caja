import React, { useState, useEffect } from 'react';
import { Printer, Plus, Edit2, Trash2, Settings, Eye, FileText, CheckCircle } from 'lucide-react';
import { printService, PrinterConfig, PrintDocument } from '../../services/printService';
import { realtimeService } from '../../services/realtimeService';

const PrinterManagement: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [documents, setDocuments] = useState<PrintDocument[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'printers' | 'documents'>('printers');
  const [formData, setFormData] = useState({
    name: '',
    type: 'thermal' as 'thermal' | 'laser' | 'inkjet',
    paperSize: '80mm' as 'A4' | '80mm' | '58mm',
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    loadData();
    
    // Suscribirse a actualizaciones en tiempo real
    const unsubscribe = realtimeService.subscribe('printer', (event) => {
      console.log('🔄 Actualización de impresora en tiempo real:', event);
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = () => {
    setPrinters(printService.getAllPrinters());
    setDocuments(printService.getDocuments());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPrinter) {
      printService.updatePrinter(editingPrinter.id, formData);
    } else {
      printService.addPrinter(formData);
    }

    loadData();
    resetForm();
  };

  const handleEdit = (printer: PrinterConfig) => {
    setEditingPrinter(printer);
    setFormData({
      name: printer.name,
      type: printer.type,
      paperSize: printer.paperSize,
      isDefault: printer.isDefault,
      isActive: printer.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta impresora?')) {
      printService.deletePrinter(id);
      loadData();
    }
  };

  const toggleDefault = (id: string) => {
    printService.updatePrinter(id, { isDefault: true });
    loadData();
  };

  const toggleActive = (id: string, isActive: boolean) => {
    printService.updatePrinter(id, { isActive: !isActive });
    loadData();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'thermal',
      paperSize: '80mm',
      isDefault: false,
      isActive: true
    });
    setEditingPrinter(null);
    setShowModal(false);
  };

  const previewDocument = (document: PrintDocument) => {
    printService.previewDocument(document);
  };

  const testPrint = async (printerId: string) => {
    const testData = {
      requestId: 'TEST-' + Date.now(),
      userName: 'Usuario de Prueba',
      amount: 100.00,
      reason: 'Prueba de impresión del sistema',
      processedBy: 'Administrador',
      processedAt: new Date().toISOString(),
      companyLogo: localStorage.getItem('companyLogo') || ''
    };

    const success = await printService.printCashRegisterDocument(testData, printerId);
    if (success) {
      alert('✅ Impresión de prueba enviada correctamente');
      loadData();
    } else {
      alert('❌ Error al enviar impresión de prueba');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Impresoras</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configura y administra las impresoras del sistema</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            🔄 Actualizaciones automáticas en tiempo real
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('printers')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'printers'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Impresoras
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Documentos
            </button>
          </div>
          
          {activeTab === 'printers' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Impresora</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'printers' ? (
        <div className="space-y-4">
          {printers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center">
              <Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay impresoras configuradas</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Agrega tu primera impresora para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {printers.map((printer) => (
                <div
                  key={printer.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border-2 ${
                    printer.isDefault ? 'border-blue-400' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        printer.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Printer className={`w-5 h-5 ${
                          printer.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{printer.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {printer.type} • {printer.paperSize}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => testPrint(printer.id)}
                        className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        title="Prueba de impresión"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(printer)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(printer.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        disabled={printer.isDefault}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
                      <button
                        onClick={() => toggleActive(printer.id, printer.isActive)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          printer.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {printer.isActive ? 'Activa' : 'Inactiva'}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Predeterminada:</span>
                      <button
                        onClick={() => toggleDefault(printer.id)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          printer.isDefault 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {printer.isDefault ? 'Sí' : 'No'}
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                      Agregada: {new Date(printer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay documentos generados</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Los documentos aparecerán aquí cuando se procesen solicitudes</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Solicitud
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Formato
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
                    {documents.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                #{document.id.slice(-6)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Comprobante de Caja
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          #{document.requestId.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            {document.format.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(document.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => previewDocument(document)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors mr-3"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Modal para agregar/editar impresora */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingPrinter ? 'Editar Impresora' : 'Nueva Impresora'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de la Impresora
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: Impresora Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Impresora
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="thermal">Térmica</option>
                  <option value="laser">Láser</option>
                  <option value="inkjet">Inyección de Tinta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tamaño de Papel
                </label>
                <select
                  value={formData.paperSize}
                  onChange={(e) => setFormData({...formData, paperSize: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="80mm">80mm (Térmica)</option>
                  <option value="58mm">58mm (Térmica)</option>
                  <option value="A4">A4 (Estándar)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Establecer como predeterminada
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Impresora activa
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPrinter ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterManagement;