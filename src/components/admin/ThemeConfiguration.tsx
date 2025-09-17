import React, { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw, Eye, Download, Upload, Sparkles, Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    size: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: string;
    easing: string;
  };
}

const ThemeConfiguration: React.FC = () => {
  const { isDarkMode, currentTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'effects' | 'presets'>('colors');
  const [customTheme, setCustomTheme] = useState<CustomTheme>(getDefaultTheme());
  const [previewMode, setPreviewMode] = useState(false);
  const [savedThemes, setSavedThemes] = useState<CustomTheme[]>([]);

  useEffect(() => {
    loadSavedThemes();
    loadCurrentTheme();
  }, []);

  function getDefaultTheme(): CustomTheme {
    return {
      id: 'default',
      name: 'Tema Predeterminado',
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Inter, system-ui, sans-serif',
        size: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
      },
      animations: {
        duration: '300ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    };
  }

  const loadSavedThemes = () => {
    const saved = localStorage.getItem('customThemes');
    if (saved) {
      setSavedThemes(JSON.parse(saved));
    }
  };

  const loadCurrentTheme = () => {
    const current = localStorage.getItem('currentCustomTheme');
    if (current) {
      setCustomTheme(JSON.parse(current));
    }
  };

  const saveTheme = () => {
    const themes = [...savedThemes];
    const existingIndex = themes.findIndex(t => t.id === customTheme.id);
    
    if (existingIndex >= 0) {
      themes[existingIndex] = customTheme;
    } else {
      themes.push(customTheme);
    }
    
    setSavedThemes(themes);
    localStorage.setItem('customThemes', JSON.stringify(themes));
    localStorage.setItem('currentCustomTheme', JSON.stringify(customTheme));
    
    alert('✅ Tema guardado exitosamente');
  };

  const applyTheme = () => {
    const root = document.documentElement;
    
    // Aplicar variables CSS personalizadas
    Object.entries(customTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    Object.entries(customTheme.fonts.size).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    
    Object.entries(customTheme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    Object.entries(customTheme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });
    
    root.style.setProperty('--font-primary', customTheme.fonts.primary);
    root.style.setProperty('--animation-duration', customTheme.animations.duration);
    root.style.setProperty('--animation-easing', customTheme.animations.easing);
    
    localStorage.setItem('currentCustomTheme', JSON.stringify(customTheme));
    alert('✅ Tema aplicado exitosamente');
  };

  const resetToDefault = () => {
    if (confirm('¿Estás seguro de que quieres restablecer el tema predeterminado?')) {
      setCustomTheme(getDefaultTheme());
      const root = document.documentElement;
      
      // Limpiar variables CSS personalizadas
      const style = root.style;
      for (let i = style.length - 1; i >= 0; i--) {
        const property = style[i];
        if (property.startsWith('--color-') || 
            property.startsWith('--font-') || 
            property.startsWith('--spacing-') || 
            property.startsWith('--border-radius-') ||
            property.startsWith('--animation-')) {
          style.removeProperty(property);
        }
      }
      
      localStorage.removeItem('currentCustomTheme');
      alert('✅ Tema restablecido al predeterminado');
    }
  };

  const exportTheme = () => {
    const dataStr = JSON.stringify(customTheme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tema-${customTheme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setCustomTheme(imported);
          alert('✅ Tema importado exitosamente');
        } catch (error) {
          alert('❌ Error al importar el tema. Verifica que el archivo sea válido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const presetThemes = [
    {
      name: 'Azul Corporativo',
      theme: {
        ...getDefaultTheme(),
        id: 'corporate-blue',
        name: 'Azul Corporativo',
        colors: {
          ...getDefaultTheme().colors,
          primary: '#1e40af',
          secondary: '#3730a3',
          accent: '#0ea5e9'
        }
      }
    },
    {
      name: 'Verde Natura',
      theme: {
        ...getDefaultTheme(),
        id: 'nature-green',
        name: 'Verde Natura',
        colors: {
          ...getDefaultTheme().colors,
          primary: '#059669',
          secondary: '#047857',
          accent: '#10b981'
        }
      }
    },
    {
      name: 'Púrpura Elegante',
      theme: {
        ...getDefaultTheme(),
        id: 'elegant-purple',
        name: 'Púrpura Elegante',
        colors: {
          ...getDefaultTheme().colors,
          primary: '#7c3aed',
          secondary: '#5b21b6',
          accent: '#a855f7'
        }
      }
    },
    {
      name: 'Naranja Vibrante',
      theme: {
        ...getDefaultTheme(),
        id: 'vibrant-orange',
        name: 'Naranja Vibrante',
        colors: {
          ...getDefaultTheme().colors,
          primary: '#ea580c',
          secondary: '#c2410c',
          accent: '#f97316'
        }
      }
    }
  ];

  const tabs = [
    { id: 'colors', label: 'Colores', icon: Palette },
    { id: 'typography', label: 'Tipografía', icon: Monitor },
    { id: 'layout', label: 'Diseño', icon: Sun },
    { id: 'effects', label: 'Efectos', icon: Sparkles },
    { id: 'presets', label: 'Presets', icon: Eye }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración de Temas</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Personaliza la apariencia del sistema</p>
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
            onClick={saveTheme}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar</span>
          </button>
          
          <button
            onClick={applyTheme}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Aplicar</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          {activeTab === 'colors' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración de Colores</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(customTheme.colors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setCustomTheme({
                          ...customTheme,
                          colors: { ...customTheme.colors, [key]: e.target.value }
                        })}
                        className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setCustomTheme({
                          ...customTheme,
                          colors: { ...customTheme.colors, [key]: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración de Tipografía</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fuente Principal
                  </label>
                  <select
                    value={customTheme.fonts.primary}
                    onChange={(e) => setCustomTheme({
                      ...customTheme,
                      fonts: { ...customTheme.fonts, primary: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Open Sans, sans-serif">Open Sans</option>
                    <option value="Lato, sans-serif">Lato</option>
                    <option value="Poppins, sans-serif">Poppins</option>
                    <option value="Montserrat, sans-serif">Montserrat</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(customTheme.fonts.size).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        Tamaño {key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setCustomTheme({
                          ...customTheme,
                          fonts: {
                            ...customTheme.fonts,
                            size: { ...customTheme.fonts.size, [key]: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Configuración de Diseño</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Espaciado</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(customTheme.spacing).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setCustomTheme({
                            ...customTheme,
                            spacing: { ...customTheme.spacing, [key]: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Bordes Redondeados</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(customTheme.borderRadius).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setCustomTheme({
                            ...customTheme,
                            borderRadius: { ...customTheme.borderRadius, [key]: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Efectos y Animaciones</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Sombras</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(customTheme.shadows).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                          Sombra {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setCustomTheme({
                            ...customTheme,
                            shadows: { ...customTheme.shadows, [key]: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Animaciones</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duración
                      </label>
                      <input
                        type="text"
                        value={customTheme.animations.duration}
                        onChange={(e) => setCustomTheme({
                          ...customTheme,
                          animations: { ...customTheme.animations, duration: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Easing
                      </label>
                      <select
                        value={customTheme.animations.easing}
                        onChange={(e) => setCustomTheme({
                          ...customTheme,
                          animations: { ...customTheme.animations, easing: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="cubic-bezier(0.4, 0, 0.2, 1)">Ease</option>
                        <option value="linear">Linear</option>
                        <option value="cubic-bezier(0.4, 0, 1, 1)">Ease In</option>
                        <option value="cubic-bezier(0, 0, 0.2, 1)">Ease Out</option>
                        <option value="cubic-bezier(0.4, 0, 0.6, 1)">Ease In Out</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Temas Predefinidos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {presetThemes.map((preset) => (
                  <div
                    key={preset.theme.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => setCustomTheme(preset.theme)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex space-x-1">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.theme.colors.primary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.theme.colors.secondary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.theme.colors.accent }}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{preset.name}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Importar/Exportar</h4>
                <div className="flex space-x-3">
                  <button
                    onClick={exportTheme}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                  
                  <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Importar</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTheme}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Vista Previa</h3>
            
            {/* Theme Info */}
            <div className="mb-4">
              <input
                type="text"
                value={customTheme.name}
                onChange={(e) => setCustomTheme({ ...customTheme, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                placeholder="Nombre del tema"
              />
            </div>
            
            {/* Color Palette Preview */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div 
                  className="h-12 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: customTheme.colors.primary }}
                >
                  Primary
                </div>
                <div 
                  className="h-12 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: customTheme.colors.secondary }}
                >
                  Secondary
                </div>
                <div 
                  className="h-12 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: customTheme.colors.accent }}
                >
                  Accent
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div 
                  className="h-8 rounded flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: customTheme.colors.success,
                    color: 'white'
                  }}
                >
                  Success
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: customTheme.colors.warning,
                    color: 'white'
                  }}
                >
                  Warning
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: customTheme.colors.error,
                    color: 'white'
                  }}
                >
                  Error
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: customTheme.colors.info,
                    color: 'white'
                  }}
                >
                  Info
                </div>
              </div>
            </div>
            
            {/* Component Preview */}
            <div className="mt-6 space-y-3">
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: customTheme.colors.surface,
                  borderColor: customTheme.colors.border,
                  borderRadius: customTheme.borderRadius.lg
                }}
              >
                <div 
                  className="font-medium mb-1"
                  style={{ 
                    color: customTheme.colors.text,
                    fontFamily: customTheme.fonts.primary,
                    fontSize: customTheme.fonts.size.base
                  }}
                >
                  Componente de Ejemplo
                </div>
                <div 
                  className="text-sm"
                  style={{ 
                    color: customTheme.colors.textSecondary,
                    fontSize: customTheme.fonts.size.sm
                  }}
                >
                  Texto secundario de ejemplo
                </div>
              </div>
              
              <button
                className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all"
                style={{ 
                  backgroundColor: customTheme.colors.primary,
                  borderRadius: customTheme.borderRadius.md,
                  boxShadow: customTheme.shadows.md
                }}
              >
                Botón de Ejemplo
              </button>
            </div>
            
            {/* Saved Themes */}
            {savedThemes.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Temas Guardados</h4>
                <div className="space-y-2">
                  {savedThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setCustomTheme(theme)}
                      className="w-full text-left p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: theme.colors.primary }}
                          ></div>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: theme.colors.secondary }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{theme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeConfiguration;