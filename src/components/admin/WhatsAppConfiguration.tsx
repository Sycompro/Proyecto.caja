import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Settings, 
  Phone, 
  Key, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Webhook,
  BarChart3,
  MessageCircle,
  Copy,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from 'lucide-react';
import { whatsappService, WhatsAppConfig } from '../../services/whatsappService';
import { notificationService } from '../../services/notificationService';

const WhatsAppConfiguration: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppConfig>(whatsappService.getConfig());
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'webhook' | 'logs' | 'test'>('config');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] } | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState(whatsappService.getStats());

  useEffect(() => {
    loadLogs();
    updateStats();
  }, []);

  const loadLogs = () => {
    setLogs(whatsappService.getLogs());
  };

  const updateStats = () => {
    setStats(whatsappService.getStats());
  };

  const handleConfigChange = (key: keyof WhatsAppConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
  };

  const handleTemplateChange = (templateKey: string, value: string) => {
    const newTemplates = { ...config.messageTemplates, [templateKey]: value };
    setConfig({ ...config, messageTemplates: newTemplates });
  };

  const saveConfiguration = async () => {
    try {
      whatsappService.updateConfig(config);
      
      notificationService.addNotification({
        type: 'success',
        title: 'Configuración Guardada',
        message: 'La configuración de WhatsApp ha sido guardada exitosamente'
      });

      // Validar configuración si está en producción
      if (config.isProduction) {
        await validateConfiguration();
      }
    } catch (error) {
      notificationService.addNotification({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No se pudo guardar la configuración'
      });
    }
  };

  const validateConfiguration = async () => {
    setIsValidating(true);
    try {
      const result = await whatsappService.validateConfiguration();
      setValidationResult(result);
      
      if (result.isValid) {
        notificationService.addNotification({
          type: 'success',
          title: 'Configuración Válida',
          message: 'La configuración de WhatsApp es correcta'
        });
      } else {
        notificationService.addNotification({
          type: 'warning',
          title: 'Configuración Incompleta',
          message: `Se encontraron ${result.errors.length} errores`
        });
      }
    } catch (error) {
      notificationService.addNotification({
        type: 'error',
        title: 'Error de Validación',
        message: 'No se pudo validar la configuración'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const testConnection = async () => {
    try {
      await whatsappService.testConnection();
      notificationService.addNotification({
        type: 'success',
        title: 'Conexión Exitosa',
        message: 'La conexión con WhatsApp API es correcta'
      });
    } catch (error) {
      notificationService.addNotification({
        type: 'error',
        title: 'Error de Conexión',
        message: `No se pudo conectar: ${error}`
      });
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      notificationService.addNotification({
        type: 'warning',
        title: 'Datos Incompletos',
        message: 'Ingresa un número de teléfono y mensaje'
      });
      return;
    }

    try {
      await whatsappService.sendTextMessage(testPhone, testMessage);
      setTestMessage('');
      setTestPhone('');
      loadLogs();
      updateStats();
    } catch (error) {
      // El error ya se maneja en el servicio
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notificationService.addNotification({
      type: 'success',
      title: 'Copiado',
      message: 'Texto copiado al portapapeles'
    });
  };

  const resetConfiguration = () => {
    if (confirm('¿Estás seguro de que quieres restablecer la configuración?')) {
      const defaultConfig: WhatsAppConfig = {
        phoneNumber: '',
        adminPhoneNumber: '',
        accessToken: '',
        phoneNumberId: '',
        businessAccountId: '',
        webhookVerifyToken: '',
        isProduction: false,
        enableWebhook: false,
        messageTemplates: {
          newRequest: 'new_request_template',
          approval: 'approval_template',
          rejection: 'rejection_template'
        }
      };
      setConfig(defaultConfig);
      setValidationResult(null);
    }
  };

  const tabs = [
    { id: 'config', label: 'Configuración', icon: Settings },
    { id: 'templates', label: 'Plantillas', icon: MessageCircle },
    { id: 'webhook', label: 'Webhook', icon: Webhook },
    { id: 'logs', label: 'Logs', icon: BarChart3 },
    { id: 'test', label: 'Pruebas', icon: TestTube }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <span>WhatsApp Business API</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configuración completa para notificaciones de producción
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={validateConfiguration}
            disabled={isValidating}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isValidating ? 'Validando...' : 'Validar'}</span>
          </button>
          
          <button
            onClick={saveConfiguration}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar</span>
          </button>
          
          <button
            onClick={resetConfiguration}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border ${
        config.isProduction 
          ? validationResult?.isValid 
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
            : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'
          : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
      }`}>
        <div className="flex items-center space-x-3">
          {config.isProduction ? (
            validationResult?.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            )
          ) : (
            <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
          <div>
            <p className={`font-medium ${
              config.isProduction 
                ? validationResult?.isValid 
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-orange-800 dark:text-orange-200'
                : 'text-blue-800 dark:text-blue-200'
            }`}>
              {config.isProduction 
                ? validationResult?.isValid 
                  ? 'WhatsApp API Configurado y Funcionando'
                  : 'Configuración Incompleta'
                : 'Modo Desarrollo Activo'
              }
            </p>
            <p className={`text-sm ${
              config.isProduction 
                ? validationResult?.isValid 
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-orange-700 dark:text-orange-300'
                : 'text-blue-700 dark:text-blue-300'
            }`}>
              {config.isProduction 
                ? validationResult?.isValid 
                  ? 'Las notificaciones se enviarán por WhatsApp real'
                  : `${validationResult?.errors.length || 0} errores encontrados`
                : 'Las notificaciones se simularán localmente'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationResult && !validationResult.isValid && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Errores de Configuración:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
            {validationResult.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
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

      {/* Tab Content */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración Básica */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración Básica</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="isProduction"
                  checked={config.isProduction}
                  onChange={(e) => handleConfigChange('isProduction', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="isProduction" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modo Producción (enviar WhatsApp real)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono del Gerente
                </label>
                <input
                  type="tel"
                  value={config.phoneNumber}
                  onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="+1234567890"
                />
                <p className="text-xs text-gray-500 mt-1">Incluye código de país (ej: +52, +1, +34)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono del Admin
                </label>
                <input
                  type="tel"
                  value={config.adminPhoneNumber}
                  onChange={(e) => handleConfigChange('adminPhoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          {/* Configuración API */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">WhatsApp Business API</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Access Token
                </label>
                <div className="relative">
                  <input
                    type={showTokens ? 'text' : 'password'}
                    value={config.accessToken}
                    onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                    className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="EAAxxxxxxxxxxxxxxx"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowTokens(!showTokens)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.accessToken)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) => handleConfigChange('phoneNumberId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Account ID
                </label>
                <input
                  type="text"
                  value={config.businessAccountId}
                  onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="123456789012345"
                />
              </div>

              {config.isProduction && (
                <button
                  onClick={testConnection}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Probar Conexión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Plantillas de Mensaje</h3>
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Nota:</strong> Las plantillas deben estar aprobadas en WhatsApp Business Manager antes de usarlas.
                Si no tienes plantillas aprobadas, se usarán mensajes de texto normales.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plantilla para Nueva Solicitud
              </label>
              <input
                type="text"
                value={config.messageTemplates.newRequest}
                onChange={(e) => handleTemplateChange('newRequest', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="new_request_template"
              />
              <p className="text-xs text-gray-500 mt-1">Nombre de la plantilla en WhatsApp Business Manager</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plantilla para Aprobación
              </label>
              <input
                type="text"
                value={config.messageTemplates.approval}
                onChange={(e) => handleTemplateChange('approval', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="approval_template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plantilla para Rechazo
              </label>
              <input
                type="text"
                value={config.messageTemplates.rejection}
                onChange={(e) => handleTemplateChange('rejection', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="rejection_template"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'webhook' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración Webhook</h3>
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableWebhook"
                checked={config.enableWebhook}
                onChange={(e) => handleConfigChange('enableWebhook', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="enableWebhook" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Habilitar Webhook para recibir mensajes
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook Verify Token
              </label>
              <input
                type="text"
                value={config.webhookVerifyToken}
                onChange={(e) => handleConfigChange('webhookVerifyToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="mi_token_secreto_123"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">URL del Webhook</h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white dark:bg-gray-800 p-2 rounded border text-sm">
                  {window.location.origin}/api/webhook/whatsapp
                </code>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/api/webhook/whatsapp`)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Configura esta URL en WhatsApp Business Manager
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enviados</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalSent}</p>
                </div>
                <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recibidos</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalReceived}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entrega</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.deliveryRate.toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Última Actividad</p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    {stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Ninguna'}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Registro de Mensajes</h3>
                <button
                  onClick={loadLogs}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Actualizar
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mensaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.type === 'sent' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        }`}>
                          {log.type === 'sent' ? 'Enviado' : 'Recibido'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {log.to || log.from}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          log.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                          log.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {logs.length === 0 && (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No hay mensajes registrados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Pruebas de Mensajería</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Teléfono de Prueba
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje de Prueba
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Mensaje de prueba del sistema..."
              />
            </div>

            <button
              onClick={sendTestMessage}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Mensaje de Prueba</span>
            </button>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Nota:</strong> En modo desarrollo, los mensajes se simularán. 
                En modo producción, se enviará un WhatsApp real al número especificado.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConfiguration;