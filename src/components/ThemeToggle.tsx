import React, { useState } from 'react';
import { Sun, Moon, Monitor, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, size = 'md' }) => {
  const { isDarkMode, currentTheme, setTheme } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const themes = [
    {
      id: 'light' as const,
      name: 'Claro',
      icon: Sun,
      description: 'Tema claro'
    },
    {
      id: 'dark' as const,
      name: 'Oscuro',
      icon: Moon,
      description: 'Tema oscuro'
    },
    {
      id: 'system' as const,
      name: 'Sistema',
      icon: Monitor,
      description: 'Seguir preferencias del sistema'
    }
  ];

  const getCurrentIcon = () => {
    if (currentTheme === 'system') return Monitor;
    return isDarkMode ? Moon : Sun;
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className={`${sizeClasses[size]} relative overflow-hidden rounded-xl transition-all duration-300 group ${
          isDarkMode 
            ? 'bg-gray-800/80 hover:bg-gray-700/80 text-yellow-400 border border-gray-700/50' 
            : 'bg-white/80 hover:bg-gray-50/80 text-gray-700 border border-gray-200/50'
        } backdrop-blur-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
        title={`Tema actual: ${themes.find(t => t.id === currentTheme)?.name}`}
      >
        {/* Background Animation */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20' 
            : 'bg-gradient-to-br from-blue-100/50 to-purple-100/50'
        } opacity-0 group-hover:opacity-100`}></div>
        
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <CurrentIcon className={`${iconSizes[size]} transition-all duration-300 group-hover:scale-110`} />
        </div>

        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-active:opacity-30 transition-opacity duration-150 bg-current"></div>
      </button>

      {/* Theme Options Dropdown */}
      {showOptions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          ></div>
          
          {/* Dropdown */}
          <div className={`absolute right-0 top-full mt-2 z-50 min-w-48 rounded-xl shadow-2xl border backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-gray-800/95 border-gray-700/50' 
              : 'bg-white/95 border-gray-200/50'
          }`}>
            <div className="p-2">
              <div className={`text-xs font-semibold mb-2 px-3 py-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Seleccionar Tema
              </div>
              
              {themes.map((theme) => {
                const Icon = theme.icon;
                const isActive = currentTheme === theme.id;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setShowOptions(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? isDarkMode
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-blue-50 text-blue-600 border border-blue-200/50'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100/50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{theme.name}</div>
                      <div className={`text-xs ${
                        isActive
                          ? isDarkMode ? 'text-blue-300' : 'text-blue-500'
                          : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {theme.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className={`w-2 h-2 rounded-full ${
                        isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                      }`}></div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className={`px-3 py-2 border-t text-xs ${
              isDarkMode 
                ? 'border-gray-700/50 text-gray-500' 
                : 'border-gray-200/50 text-gray-500'
            }`}>
              <div className="flex items-center space-x-1">
                <Settings className="w-3 h-3" />
                <span>Preferencia guardada automáticamente</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Label */}
      {showLabel && (
        <span className={`ml-2 text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {themes.find(t => t.id === currentTheme)?.name}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;