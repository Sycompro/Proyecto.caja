import React, { useState, useEffect } from 'react';
import { Settings, Upload, X, Image, Type, Save, RotateCcw, Eye, Download, Building } from 'lucide-react';

interface SystemConfig {
  companyName: string;
  systemName: string;
  companyLogo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  version: string;
  supportEmail: string;
  supportPhone: string;
}

const SystemConfiguration: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>(loadSystemConfig());
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'contact'>('general');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Aplicar cambios en tiempo real
    if (previewMode) {
      applySystemConfig(config);
    }
  }, [config, previewMode]);

  function loadSystemConfig(): SystemConfig {
    return {
      companyName: localStorage.getItem('companyName') || 'Mi Empresa',
      systemName: localStorage.getItem('systemName') || 'Sistema de Caja Registradora',
      companyLogo: localStorage.getItem('companyLogo') || '',
      favicon: localStorage.getItem('favicon') || '',
      primaryColor: localStorage.getItem('primaryColor') || '#3b82f6',
      secondaryColor: localStorage.getItem('secondaryColor') || '#8b5cf6',
      description: localStorage.getItem('systemDescription') || 'Sistema integral de gestión de caja registradora',
      version: localStorage.getItem('systemVersion') || '1.0.0',
      supportEmail: localStorage.getItem('supportEmail') || 'soporte@empresa.com',
      supportPhone: localStorage.getItem('supportPhone') || '+1234567890'
    };
  }

  const saveSystemConfig = () => {
    // Guardar en localStorage
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'companyName') {
        localStorage.setItem('companyName', value);
      } else if (key === 'systemName') {
        localStorage.setItem('systemName', value);
      } else if (key === 'companyLogo') {
        localStorage.setItem('companyLogo', value);
      } else if (key === 'favicon') {
        localStorage.setItem('favicon', value);
      } else if (key === 'primaryColor') {
        localStorage.setItem('primaryColor', value);
      } else if (key === 'secondaryColor') {
        localStorage.setItem('secondaryColor', value);
      } else if (key === 'description') {
        localStorage.setItem('systemDescription', value);
      } else if (key === 'version') {
        localStorage.setItem('systemVersion', value);
      } else if (key === 'supportEmail') {
        localStorage.setItem('supportEmail', value);
      } else if (key === 'supportPhone') {
        localStorage.setItem('supportPhone', value);
      }
    });

    // Aplicar configuración
    applySystemConfig(config);

    // Disparar eventos para actualizar otros componentes
    window.dispatchEvent(new CustomEvent('logoUpdated', { detail: config.companyLogo }));
    window.dispatchEvent(new CustomEvent('systemConfigUpdated', { detail: config }));

    alert('✅ Configuración guardada exitosamente');
  };

  const applySystemConfig = (newConfig: SystemConfig) => {
    // Actualizar título de la página
    document.title = newConfig.systemName;

    // Actualizar favicon si existe
    if (newConfig.favicon) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = newConfig.favicon;
    }

    // Actualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = newConfig.description;

    // Actualizar variables CSS para colores
    const root = document.documentElement;
    root.style.setProperty('--color-primary', newConfig.primaryColor);
    root.style.setProperty('--color-secondary', newConfig.secondaryColor);
  };

  const resetToDefault = () => {
    if (confirm('¿Estás seguro de que quieres restablecer la configuración predeterminada?')) {
      const defaultConfig: SystemConfig = {
        companyName: 'Mi Empresa',
        systemName: 'Sistema de Caja Registradora',
        companyLogo: '',
        favicon: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        description: 'Sistema integral de gestión de caja registradora',
        version: '1.0.0',
        supportEmail: 'soporte@empresa.com',
        supportPhone: '+1234567890'
      };
      
      setConfig(defaultConfig);
      
      // Limpiar localStorage
      ['companyName', 'systemName', 'companyLogo', 'favicon', 'primaryColor', 'secondaryColor', 'systemDescription', 'systemVersion', 'supportEmail', 'supportPhone'].forEach(key => {
        localStorage.removeItem(key);
      });
      
      alert('✅ Configuración restablecida');
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'logo' | 'favicon') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'favicon') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], type);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], type);
    }
  };

  const handleFile = (file: File, type: 'logo' | 'favicon') => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    const maxSize = type === 'favicon' ? 1024 * 1024 : 2 * 1024 * 1024; // 1MB para favicon, 2MB para logo
    if (file.size > maxSize) {
      alert(`El archivo es demasiado grande. Máximo ${type === 'favicon' ? '1MB' : '2MB'}`);
      return;
    }

    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setConfig(prev => ({
        ...prev,
        [type === 'logo' ? 'companyLogo' : 'favicon']: result
      }));
      setUploading(false);
    };
    
    reader.onerror = () => {
      setUploading(false);
      alert('Error al cargar el archivo');
    };
    
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'logo' | 'favicon') => {
    if (confirm(`¿Estás seguro de que quieres eliminar ${type === 'logo' ? 'el logo' : 'el favicon'}?`)) {
      setConfig(prev => ({
        ...prev,
        [type === 'logo' ? 'companyLogo' : 'favicon']: ''
      }));
    }
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `configuracion-sistema-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setConfig(imported);
          alert('✅ Configuración importada exitosamente');
        } catch (error) {
          alert('❌ Error al importar la configuración. Verifica que el archivo sea válido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branding', label: 'Marca', icon: Image },
    { id: 'contact', label: 'Contacto', icon: Building }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración del Sistema</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Personaliza la identidad y configuración de tu sistema</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              previewMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Vista Previa</span>
          </button>
          
          <button
            onClick={exportConfig}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          
          <label className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
          </label>
          
          <button
            onClick={saveSystemConfig}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Información General</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Sistema
                </label>
                <input
                  type="text"
                  value={config.systemName}
                  onChange={(e) => setConfig({ ...config, systemName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Sistema de Caja Registradora"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={config.companyName}
                  onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Mi Empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Descripción del sistema..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Versión
                </label>
                <input
                  type="text"
                  value={config.version}
                  onChange={(e) => setConfig({ ...config, version: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="1.0.0"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Colores del Sistema</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Primario
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Secundario
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Vista Previa de Colores</h4>
                <div className="flex space-x-2">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Primario
                  </div>
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: config.secondaryColor }}
                  >
                    Secundario
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Logo de la Empresa</h3>
            
            {config.companyLogo && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo Actual:</p>
                <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-200 dark:border-gray-600">
                  <img
                    src={config.companyLogo}
                    alt="Logo actual"
                    className="max-w-full max-h-32 mx-auto object-contain"
                  />
                  <button
                    onClick={() => removeImage('logo')}
                    className="absolute top-2 right-2 p-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            )}

            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={(e) => handleDrag(e, 'logo')}
              onDragLeave={(e) => handleDrag(e, 'logo')}
              onDragOver={(e) => handleDrag(e, 'logo')}
              onDrop={(e) => handleDrop(e, 'logo')}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileInput(e, 'logo')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              
              <div className="space-y-3">
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Subiendo logo...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Arrastra tu logo aquí o{' '}
                        <span className="text-blue-600 dark:text-blue-400 font-medium">haz clic para seleccionar</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        PNG, JPG, GIF hasta 2MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Recomendaciones para el Logo:</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>• Usa imágenes con fondo transparente (PNG)</li>
                <li>• Resolución recomendada: 200x60 píxeles</li>
                <li>• El logo se ajustará automáticamente</li>
                <li>• Formato horizontal funciona mejor</li>
              </ul>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Favicon del Sistema</h3>
            
            {config.favicon && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favicon Actual:</p>
                <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-200 dark:border-gray-600">
                  <img
                    src={config.favicon}
                    alt="Favicon actual"
                    className="w-16 h-16 mx-auto object-contain"
                  />
                  <button
                    onClick={() => removeImage('favicon')}
                    className="absolute top-2 right-2 p-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            )}

            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={(e) => handleDrag(e, 'favicon')}
              onDragLeave={(e) => handleDrag(e, 'favicon')}
              onDragOver={(e) => handleDrag(e, 'favicon')}
              onDrop={(e) => handleDrop(e, 'favicon')}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileInput(e, 'favicon')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              
              <div className="space-y-3">
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Subiendo favicon...</p>
                  </div>
                ) : (
                  <>
                    <Image className="w-8 h-8 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Arrastra tu favicon aquí o{' '}
                        <span className="text-blue-600 dark:text-blue-400 font-medium">haz clic para seleccionar</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        ICO, PNG hasta 1MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg mt-4">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>💡 Recomendaciones para el Favicon:</strong>
              </p>
              <ul className="text-xs text-purple-700 dark:text-purple-300 mt-1 space-y-1">
                <li>• Tamaño recomendado: 32x32 píxeles</li>
                <li>• Formato ICO o PNG</li>
                <li>• Diseño simple y reconocible</li>
                <li>• Se mostrará en la pestaña del navegador</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Información de Contacto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email de Soporte
                </label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="soporte@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono de Soporte
                </label>
                <input
                  type="tel"
                  value={config.supportPhone}
                  onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Vista Previa del Sistema</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {config.companyLogo ? (
                    <img
                      src={config.companyLogo}
                      alt="Logo"
                      className="h-8 w-auto max-w-[120px] object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{config.systemName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{config.companyName}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                  <span>v{config.version}</span>
                  <span>{config.supportEmail}</span>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✅ Configuración Lista</strong>
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Los cambios se aplicarán inmediatamente al guardar la configuración.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfiguration;