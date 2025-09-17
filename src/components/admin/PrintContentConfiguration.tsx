import React, { useState, useEffect } from 'react';
import { Settings, Eye, Save, RotateCcw, Download, Upload, FileText, Plus, Trash2, Copy } from 'lucide-react';
import { printService, PrintTemplate } from '../../services/printService';

const PrintContentConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'styling' | 'preview' | 'templates'>('content');
  const [template, setTemplate] = useState<PrintTemplate>(printService.getCurrentTemplate());
  const [savedTemplates, setSavedTemplates] = useState<PrintTemplate[]>([]);
  const [previewData, setPreviewData] = useState({
    requestId: 'REQ-2024-001',
    userName: 'Juan Pérez',
    amount: 150.75,
    reason: 'Apertura de caja para inicio de turno matutino',
    processedBy: 'María González',
    processedAt: new Date().toISOString(),
    companyLogo: localStorage.getItem('companyLogo') || ''
  });

  useEffect(() => {
    loadSavedTemplates();
  }, []);

  const loadSavedTemplates = () => {
    const saved = localStorage.getItem('printTemplates');
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  };

  const saveTemplate = () => {
    const templates = [...savedTemplates];
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        name: template.name || `Plantilla ${templates.length + 1}`
      };
      templates.push(newTemplate);
      setTemplate(newTemplate);
    }
    
    setSavedTemplates(templates);
    localStorage.setItem('printTemplates', JSON.stringify(templates));
    localStorage.setItem('currentPrintTemplate', JSON.stringify(template));
    
    alert('✅ Plantilla guardada exitosamente');
  };

  const loadTemplate = (templateToLoad: PrintTemplate) => {
    setTemplate(templateToLoad);
    localStorage.setItem('currentPrintTemplate', JSON.stringify(templateToLoad));
    alert('✅ Plantilla cargada exitosamente');
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      setSavedTemplates(updatedTemplates);
      localStorage.setItem('printTemplates', JSON.stringify(updatedTemplates));
      alert('✅ Plantilla eliminada exitosamente');
    }
  };

  const resetToDefault = () => {
    if (confirm('¿Estás seguro de que quieres restablecer la configuración predeterminada?')) {
      const defaultTemplate = printService.getCurrentTemplate();
      setTemplate(defaultTemplate);
      localStorage.setItem('currentPrintTemplate', JSON.stringify(defaultTemplate));
      alert('✅ Configuración restablecida');
    }
  };

  const exportTemplate = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla-impresion-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setTemplate(imported);
          alert('✅ Plantilla importada exitosamente');
        } catch (error) {
          alert('❌ Error al importar la plantilla. Verifica que el archivo sea válido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const addCustomField = () => {
    const newField = {
      id: Date.now().toString(),
      label: 'Campo Personalizado',
      value: 'Valor de ejemplo',
      enabled: true
    };
    
    setTemplate({
      ...template,
      content: {
        ...template.content,
        customFields: [...template.content.customFields, newField]
      }
    });
  };

  const removeCustomField = (fieldId: string) => {
    setTemplate({
      ...template,
      content: {
        ...template.content,
        customFields: template.content.customFields.filter(f => f.id !== fieldId)
      }
    });
  };

  const updateCustomField = (fieldId: string, updates: Partial<typeof template.content.customFields[0]>) => {
    setTemplate({
      ...template,
      content: {
        ...template.content,
        customFields: template.content.customFields.map(f => 
          f.id === fieldId ? { ...f, ...updates } : f
        )
      }
    });
  };

  // FUNCIÓN CORREGIDA: Generar vista previa
  const generatePreview = () => {
    try {
      // Crear un documento temporal usando el servicio de impresión
      const tempDocument = {
        id: 'preview-' + Date.now(),
        requestId: previewData.requestId,
        content: '', // Se generará automáticamente
        format: 'html' as const,
        createdAt: new Date().toISOString()
      };

      // Guardar la plantilla actual temporalmente
      const currentTemplate = localStorage.getItem('currentPrintTemplate');
      localStorage.setItem('currentPrintTemplate', JSON.stringify(template));

      // Generar el contenido usando el servicio
      const document = printService.generateCashRegisterDocument(previewData);

      // Restaurar la plantilla anterior si existía
      if (currentTemplate) {
        localStorage.setItem('currentPrintTemplate', currentTemplate);
      }

      // Abrir ventana de vista previa
      const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      if (!previewWindow) {
        alert('❌ No se pudo abrir la ventana de vista previa. Verifica que no esté bloqueada por el navegador.');
        return;
      }

      // Escribir el contenido en la ventana
      previewWindow.document.write(document.content);
      previewWindow.document.close();

      // Agregar título a la ventana
      previewWindow.document.title = 'Vista Previa - Comprobante de Caja';

      // Agregar botón de impresión
      const printButton = previewWindow.document.createElement('button');
      printButton.textContent = '🖨️ Imprimir Vista Previa';
      printButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      printButton.onclick = () => previewWindow.print();
      previewWindow.document.body.appendChild(printButton);

      // Agregar botón de cerrar
      const closeButton = previewWindow.document.createElement('button');
      closeButton.textContent = '❌ Cerrar';
      closeButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 180px;
        z-index: 1000;
        background: #ef4444;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      closeButton.onclick = () => previewWindow.close();
      previewWindow.document.body.appendChild(closeButton);

    } catch (error) {
      console.error('Error al generar vista previa:', error);
      alert('❌ Error al generar la vista previa. Verifica la configuración de la plantilla.');
    }
  };

  const tabs = [
    { id: 'content', label: 'Contenido', icon: FileText },
    { id: 'styling', label: 'Estilo', icon: Settings },
    { id: 'preview', label: 'Vista Previa', icon: Eye },
    { id: 'templates', label: 'Plantillas', icon: Copy }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración de Impresión</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Personaliza el contenido y formato de los comprobantes</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generatePreview}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Vista Previa</span>
          </button>
          
          <button
            onClick={saveTemplate}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar</span>
          </button>
          
          <button
            onClick={resetToDefault}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

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
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración del Encabezado</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showLogo"
                  checked={template.header.showLogo}
                  onChange={(e) => setTemplate({
                    ...template,
                    header: { ...template.header, showLogo: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showLogo" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar logo de la empresa
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCompanyName"
                  checked={template.header.showCompanyName}
                  onChange={(e) => setTemplate({
                    ...template,
                    header: { ...template.header, showCompanyName: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showCompanyName" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar nombre de la empresa
                </label>
              </div>

              {template.header.showCompanyName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    value={template.header.companyName}
                    onChange={(e) => setTemplate({
                      ...template,
                      header: { ...template.header, companyName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showDate"
                  checked={template.header.showDate}
                  onChange={(e) => setTemplate({
                    ...template,
                    header: { ...template.header, showDate: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showDate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar fecha
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTime"
                  checked={template.header.showTime}
                  onChange={(e) => setTemplate({
                    ...template,
                    header: { ...template.header, showTime: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showTime" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar hora
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Encabezado personalizado
                </label>
                <textarea
                  value={template.header.customHeader}
                  onChange={(e) => setTemplate({
                    ...template,
                    header: { ...template.header, customHeader: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={2}
                  placeholder="Texto adicional para el encabezado..."
                />
              </div>
            </div>
          </div>

          {/* Content Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración del Contenido</h3>
            <div className="space-y-4">
              {Object.entries({
                showRequestId: 'ID de solicitud',
                showUserName: 'Nombre del usuario',
                showAmount: 'Monto autorizado',
                showReason: 'Motivo de apertura',
                showProcessedBy: 'Procesado por',
                showProcessedAt: 'Fecha de procesamiento'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={template.content[key as keyof typeof template.content] as boolean}
                    onChange={(e) => setTemplate({
                      ...template,
                      content: { ...template.content, [key]: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={key} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                </div>
              ))}

              {/* Custom Fields */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Campos Personalizados</h4>
                  <button
                    onClick={addCustomField}
                    className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Agregar</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {template.content.customFields.map((field) => (
                    <div key={field.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={(e) => updateCustomField(field.id, { enabled: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Campo Activo</span>
                        </div>
                        <button
                          onClick={() => removeCustomField(field.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Etiqueta"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Valor"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración del Pie de Página</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showSignatures"
                  checked={template.footer.showSignatures}
                  onChange={(e) => setTemplate({
                    ...template,
                    footer: { ...template.footer, showSignatures: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showSignatures" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar espacios para firmas
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showBarcode"
                  checked={template.footer.showBarcode}
                  onChange={(e) => setTemplate({
                    ...template,
                    footer: { ...template.footer, showBarcode: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showBarcode" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar código de barras
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTimestamp"
                  checked={template.footer.showTimestamp}
                  onChange={(e) => setTemplate({
                    ...template,
                    footer: { ...template.footer, showTimestamp: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showTimestamp" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar timestamp de generación
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showWarning"
                  checked={template.footer.showWarning}
                  onChange={(e) => setTemplate({
                    ...template,
                    footer: { ...template.footer, showWarning: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showWarning" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar advertencia legal
                </label>
              </div>

              {template.footer.showWarning && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Texto de advertencia
                  </label>
                  <textarea
                    value={template.footer.warningText}
                    onChange={(e) => setTemplate({
                      ...template,
                      footer: { ...template.footer, warningText: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={2}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pie de página personalizado
                </label>
                <textarea
                  value={template.footer.customFooter}
                  onChange={(e) => setTemplate({
                    ...template,
                    footer: { ...template.footer, customFooter: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={2}
                  placeholder="Texto adicional para el pie de página..."
                />
              </div>
            </div>
          </div>

          {/* Language Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración de Idioma</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Idioma
                </label>
                <select
                  value={template.language.locale}
                  onChange={(e) => setTemplate({
                    ...template,
                    language: { ...template.language, locale: e.target.value as 'es' | 'en' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Moneda
                </label>
                <select
                  value={template.language.currency}
                  onChange={(e) => setTemplate({
                    ...template,
                    language: { ...template.language, currency: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="COP">COP - Peso Colombiano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Formato de fecha
                </label>
                <select
                  value={template.language.dateFormat}
                  onChange={(e) => setTemplate({
                    ...template,
                    language: { ...template.language, dateFormat: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Formato de hora
                </label>
                <select
                  value={template.language.timeFormat}
                  onChange={(e) => setTemplate({
                    ...template,
                    language: { ...template.language, timeFormat: e.target.value as '12h' | '24h' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="24h">24 horas</option>
                  <option value="12h">12 horas (AM/PM)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'styling' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Typography */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Tipografía</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tamaño de fuente
                </label>
                <select
                  value={template.styling.fontSize}
                  onChange={(e) => setTemplate({
                    ...template,
                    styling: { ...template.styling, fontSize: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="small">Pequeño</option>
                  <option value="medium">Mediano</option>
                  <option value="large">Grande</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Familia de fuente
                </label>
                <select
                  value={template.styling.fontFamily}
                  onChange={(e) => setTemplate({
                    ...template,
                    styling: { ...template.styling, fontFamily: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="courier">Courier New (Monospace)</option>
                  <option value="arial">Arial (Sans-serif)</option>
                  <option value="times">Times New Roman (Serif)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Diseño</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tamaño de papel
                </label>
                <select
                  value={template.styling.paperSize}
                  onChange={(e) => setTemplate({
                    ...template,
                    styling: { ...template.styling, paperSize: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="A4">A4 (Estándar)</option>
                  <option value="80mm">80mm (Térmica)</option>
                  <option value="58mm">58mm (Térmica)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Márgenes
                </label>
                <select
                  value={template.styling.margins}
                  onChange={(e) => setTemplate({
                    ...template,
                    styling: { ...template.styling, margins: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="small">Pequeños</option>
                  <option value="medium">Medianos</option>
                  <option value="large">Grandes</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showBorders"
                  checked={template.styling.showBorders}
                  onChange={(e) => setTemplate({
                    ...template,
                    styling: { ...template.styling, showBorders: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showBorders" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mostrar bordes
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estilo del encabezado
                </label>
                <select
                  value={template.styling.headerStyle}
                  onChange={(e) => setTemplate({
                    ...template,
                    styling: { ...template.styling, headerStyle: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="simple">Simple</option>
                  <option value="bordered">Con borde</option>
                  <option value="highlighted">Resaltado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Data Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Datos de Ejemplo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID de Solicitud
                </label>
                <input
                  type="text"
                  value={previewData.requestId}
                  onChange={(e) => setPreviewData({ ...previewData, requestId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Usuario
                </label>
                <input
                  type="text"
                  value={previewData.userName}
                  onChange={(e) => setPreviewData({ ...previewData, userName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={previewData.amount}
                  onChange={(e) => setPreviewData({ ...previewData, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo
                </label>
                <textarea
                  value={previewData.reason}
                  onChange={(e) => setPreviewData({ ...previewData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Procesado por
                </label>
                <input
                  type="text"
                  value={previewData.processedBy}
                  onChange={(e) => setPreviewData({ ...previewData, processedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <button
                onClick={generatePreview}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span>Generar Vista Previa</span>
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Información de la Plantilla</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Resumen de Configuración</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>Idioma: {template.language.locale === 'es' ? 'Español' : 'English'}</div>
                  <div>Moneda: {template.language.currency}</div>
                  <div>Papel: {template.styling.paperSize}</div>
                  <div>Fuente: {template.styling.fontFamily} ({template.styling.fontSize})</div>
                  <div>Campos personalizados: {template.content.customFields.filter(f => f.enabled).length}</div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Consejos</h4>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Usa la vista previa para verificar el formato</li>
                  <li>• Guarda diferentes plantillas para distintos casos</li>
                  <li>• Los campos personalizados son útiles para información específica</li>
                  <li>• El formato térmico es ideal para impresoras de recibos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Template Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportTemplate}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Plantilla</span>
            </button>
            
            <label className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Importar Plantilla</span>
              <input
                type="file"
                accept=".json"
                onChange={importTemplate}
                className="hidden"
              />
            </label>
          </div>

          {/* Saved Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Plantillas Guardadas</h3>
            
            {savedTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No hay plantillas guardadas</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Guarda tu primera plantilla para comenzar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTemplates.map((savedTemplate) => (
                  <div key={savedTemplate.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{savedTemplate.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {savedTemplate.language.locale === 'es' ? 'Español' : 'English'} • {savedTemplate.styling.paperSize}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTemplate(savedTemplate.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Campos activos: {Object.values(savedTemplate.content).filter(v => v === true).length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Personalizados: {savedTemplate.content.customFields.filter(f => f.enabled).length}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => loadTemplate(savedTemplate)}
                      className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Cargar Plantilla
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintContentConfiguration;