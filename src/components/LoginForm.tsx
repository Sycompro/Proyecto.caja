import React, { useState, useEffect } from 'react';
import { LogIn, User, Lock, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(() => 
    localStorage.getItem('companyLogo') || ''
  );
  const [systemName, setSystemName] = useState(() => 
    localStorage.getItem('systemName') || 'Sistema de Caja'
  );
  const [companyName, setCompanyName] = useState(() => 
    localStorage.getItem('companyName') || 'Mi Empresa'
  );
  const { login } = useAuth();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleLogoUpdate = (event: CustomEvent) => {
      setCompanyLogo(event.detail);
    };

    const handleSystemConfigUpdate = (event: CustomEvent) => {
      const config = event.detail;
      setSystemName(config.systemName || 'Sistema de Caja');
      setCompanyName(config.companyName || 'Mi Empresa');
      setCompanyLogo(config.companyLogo || '');
    };

    window.addEventListener('logoUpdated', handleLogoUpdate as EventListener);
    window.addEventListener('systemConfigUpdated', handleSystemConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate as EventListener);
      window.removeEventListener('systemConfigUpdated', handleSystemConfigUpdate as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-black dark:via-gray-900 dark:to-slate-900">
        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 dark:bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 dark:bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400 dark:bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-blue-300 dark:bg-blue-400 rounded-full opacity-40 animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-300 dark:bg-purple-400 rounded-full opacity-50 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-pink-300 dark:bg-pink-400 rounded-full opacity-30 animate-pulse animation-delay-3000"></div>
        </div>
      </div>

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="lg" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800/50 p-6 w-full max-w-sm transition-colors duration-300">
          {/* Glass Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 dark:from-gray-800/20 dark:to-gray-800/5 rounded-2xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center">
                {companyLogo ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30"></div>
                    <img
                      src={companyLogo}
                      alt="Logo de la empresa"
                      className="relative max-w-full max-h-full object-contain drop-shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-50"></div>
                    <div className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
                      <LogIn className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {systemName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm font-medium">
                {companyName}
              </p>
              <p className="text-gray-500 dark:text-gray-500 mt-1 text-xs">
                Ingresa tus credenciales
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50/80 dark:bg-red-900/30 backdrop-blur border border-red-200/50 dark:border-red-800/50 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Usuario
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:bg-white/90 dark:focus:bg-gray-800/90 transition-all text-sm font-medium placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                    placeholder="Ingresa tu usuario"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:bg-white/90 dark:focus:bg-gray-800/90 transition-all text-sm font-medium placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                <span className="relative">
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </span>
              </button>
            </form>

            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/80 backdrop-blur rounded-lg border border-gray-200/30 dark:border-gray-700/30">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-xs flex items-center gap-2">
                <Settings className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                Credenciales de prueba:
              </h3>
              <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                  <span className="font-medium">Admin:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">admin / admin123</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                  <span className="font-medium">Usuario:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">usuario1 / user123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;