import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import AdminDashboard from './components/admin/AdminDashboard';
import UserDashboard from './components/user/UserDashboard';
import ToastContainer from './components/ToastContainer';
import ChatButton from './components/chat/ChatButton';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <>
        <LoginForm />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-blue-900/30 dark:to-indigo-900/50 relative transition-colors duration-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>
      
      {/* Subtle Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-purple-200/20 dark:bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>
      
      <Header />
      <main className="relative z-10">
        {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
      </main>
      
      {/* Chat Button - Solo para usuarios autenticados */}
      <ChatButton />
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;