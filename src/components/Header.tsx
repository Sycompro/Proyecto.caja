import React, { useState, useEffect } from 'react';
import { LogOut, User, Settings, Menu, X, Image } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LogoUpload from './LogoUpload';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import RealtimeIndicator from './RealtimeIndicator';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(() => 
    localStorage.getItem('companyLogo') || ''
  );
  const [systemName, setSystemName] = useState(() => 
    localStorage.getItem('systemName') || 'Sistema de Caja'
  );

  useEffect(() => {
    const handleLogoUpdate = (event: CustomEvent) => {
      setCompanyLogo(event.detail);
    };

    const handleSystemConfigUpdate = (event: CustomEvent) => {
      const config = event.detail;
      setSystemName(config.systemName || 'Sistema de Caja');
      setCompanyLogo(config.companyLogo || '');
    };

    window.addEventListener('logoUpdated', handleLogoUpdate as EventListener);
    window.addEventListener('systemConfigUpdated', handleSystemConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate as EventListener);
      window.removeEventListener('systemConfigUpdated', handleSystemConfigUpdate as EventListener);
    };
  }, []);

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-800/50 sticky top-0 z-40 transition-colors duration-300">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/30 dark:from-blue-900/20 dark:to-purple-900/20 pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y Nombre - Lado Izquierdo */}
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                {companyLogo ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur opacity-50"></div>
                    <img
                      src={companyLogo}
                      alt="Logo de la empresa"
                      className="relative h-10 w-auto max-w-[60px] object-contain drop-shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Nombre del Sistema */}
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  {systemName}
                </h1>
              </div>
            </div>

            {/* Controles - Lado Derecho */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Desktop Menu */}
              <div className="hidden sm:flex items-center space-x-3">
                {/* Realtime Indicator */}
                <RealtimeIndicator />
                
                {/* Theme Toggle */}
                <ThemeToggle size="md" />
                
                {/* Notification Center */}
                <NotificationCenter userId={user?.id} />
                
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowLogoUpload(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 backdrop-blur"
                  >
                    <Image className="w-4 h-4" />
                    <span className="hidden lg:inline">Logo</span>
                  </button>
                )}
                
                {/* User Info */}
                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur rounded-xl border border-gray-200/30 dark:border-gray-700/30">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm hidden lg:block">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.fullName}</p>
                    <p className="text-gray-600 dark:text-gray-400 capitalize text-xs">{user?.role}</p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 backdrop-blur"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Cerrar Sesión</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="sm:hidden flex items-center space-x-2">
                {/* Mobile Realtime Indicator */}
                <RealtimeIndicator />
                
                {/* Mobile Theme Toggle */}
                <ThemeToggle size="sm" />
                
                {/* Mobile Notification Center */}
                <NotificationCenter userId={user?.id} />
                
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all backdrop-blur"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200/30 dark:border-gray-700/30 py-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-b-xl mt-1">
              {/* Mobile System Name */}
              <div className="px-4 py-2 mb-3">
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  {systemName}
                </h1>
              </div>

              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-gray-50/80 to-blue-50/50 dark:from-gray-800/80 dark:to-blue-900/50 rounded-xl mb-3 mx-4 border border-gray-200/30 dark:border-gray-700/30">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.fullName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
              
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowLogoUpload(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-xl transition-all mb-2 backdrop-blur mx-4"
                >
                  <Image className="w-5 h-5" />
                  <span>Configurar Logo</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-red-50/50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all backdrop-blur mx-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Logo Upload Modal */}
      {showLogoUpload && (
        <LogoUpload onClose={() => setShowLogoUpload(false)} />
      )}
    </>
  );
};

export default Header;