interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'request' | 'approval';
  title: string;
  message: string;
  userId?: string; // Para notificaciones específicas de usuario
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationConfig {
  enableBrowserNotifications: boolean;
  enableSoundAlerts: boolean;
  enableEmailNotifications: boolean;
  autoMarkAsRead: boolean;
  notificationDuration: number; // en segundos
  enabledTypes: string[];
  showInternalToasts: boolean; // Nueva opción para toasts internos
}

class NotificationService {
  private notifications: Notification[] = [];
  private config: NotificationConfig;
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private toastListeners: ((toast: ToastNotification) => void)[] = [];

  constructor() {
    this.loadNotifications();
    this.config = this.loadConfig();
    
    // Limpiar notificaciones expiradas cada minuto
    setInterval(() => this.cleanExpiredNotifications(), 60000);
  }

  // Configuración
  private loadConfig(): NotificationConfig {
    const stored = localStorage.getItem('notificationConfig');
    return stored ? JSON.parse(stored) : {
      enableBrowserNotifications: false, // Deshabilitado por defecto
      enableSoundAlerts: true,
      enableEmailNotifications: false,
      autoMarkAsRead: false,
      notificationDuration: 5,
      enabledTypes: ['info', 'success', 'warning', 'error', 'request', 'approval'],
      showInternalToasts: true // Habilitado por defecto
    };
  }

  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('notificationConfig', JSON.stringify(this.config));
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Gestión de notificaciones
  private loadNotifications(): void {
    const stored = localStorage.getItem('notifications');
    this.notifications = stored ? JSON.parse(stored) : [];
  }

  private saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
    this.notifyListeners();
  }

  addNotification(notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): string {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: notification.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas por defecto
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();

    // Mostrar toast interno en lugar de notificación del navegador
    if (this.config.showInternalToasts && this.config.enabledTypes.includes(notification.type)) {
      this.showInternalToast(newNotification);
    }

    // Reproducir sonido si está habilitado
    if (this.config.enableSoundAlerts && this.config.enabledTypes.includes(notification.type)) {
      this.playNotificationSound(notification.type);
    }

    return newNotification.id;
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(userId?: string): void {
    this.notifications.forEach(notification => {
      if (!userId || notification.userId === userId) {
        notification.isRead = true;
      }
    });
    this.saveNotifications();
  }

  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
  }

  clearAll(userId?: string): void {
    if (userId) {
      this.notifications = this.notifications.filter(n => n.userId !== userId);
    } else {
      this.notifications = [];
    }
    this.saveNotifications();
  }

  getNotifications(userId?: string): Notification[] {
    return this.notifications.filter(n => !userId || !n.userId || n.userId === userId);
  }

  getUnreadCount(userId?: string): number {
    return this.getNotifications(userId).filter(n => !n.isRead).length;
  }

  // Notificaciones específicas del sistema
  notifyNewRequest(requestData: { id: string; userName: string; amount: number }): void {
    this.addNotification({
      type: 'request',
      title: 'Nueva Solicitud de Caja',
      message: `${requestData.userName} solicita apertura de caja por $${requestData.amount.toFixed(2)}`,
      actionUrl: '/admin/requests',
      metadata: { requestId: requestData.id }
    });
  }

  notifyRequestApproved(requestData: { id: string; userName: string; amount: number; processedBy: string }): void {
    this.addNotification({
      type: 'approval',
      title: 'Solicitud Aprobada',
      message: `Tu solicitud de $${requestData.amount.toFixed(2)} ha sido aprobada por ${requestData.processedBy}`,
      userId: requestData.userName, // En un sistema real, sería el userId
      metadata: { requestId: requestData.id }
    });
  }

  notifyRequestRejected(requestData: { id: string; userName: string; amount: number; reason?: string }): void {
    this.addNotification({
      type: 'error',
      title: 'Solicitud Rechazada',
      message: `Tu solicitud de $${requestData.amount.toFixed(2)} ha sido rechazada${requestData.reason ? `: ${requestData.reason}` : ''}`,
      userId: requestData.userName,
      metadata: { requestId: requestData.id }
    });
  }

  notifySystemEvent(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.addNotification({
      type,
      title,
      message
    });
  }

  notifyPrinterStatus(printerName: string, status: 'connected' | 'disconnected' | 'error'): void {
    const typeMap = {
      connected: 'success' as const,
      disconnected: 'warning' as const,
      error: 'error' as const
    };

    const messageMap = {
      connected: `Impresora ${printerName} conectada correctamente`,
      disconnected: `Impresora ${printerName} desconectada`,
      error: `Error en impresora ${printerName}`
    };

    this.addNotification({
      type: typeMap[status],
      title: 'Estado de Impresora',
      message: messageMap[status],
      metadata: { printerName, status }
    });
  }

  // Sistema de toasts internos
  private showInternalToast(notification: Notification): void {
    const toast: ToastNotification = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      duration: this.config.notificationDuration * 1000,
      createdAt: Date.now()
    };

    this.notifyToastListeners(toast);
  }

  // Sonidos de notificación
  private playNotificationSound(type: string): void {
    try {
      // Crear diferentes tonos para diferentes tipos
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Frecuencias diferentes para cada tipo
      const frequencies = {
        info: 800,
        success: 1000,
        warning: 600,
        error: 400,
        request: 1200,
        approval: 1000
      };

      oscillator.frequency.setValueAtTime(frequencies[type as keyof typeof frequencies] || 800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('No se pudo reproducir el sonido de notificación:', error);
    }
  }

  // Limpieza automática
  private cleanExpiredNotifications(): void {
    const now = new Date().toISOString();
    const initialCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(n => 
      !n.expiresAt || n.expiresAt > now
    );

    if (this.notifications.length !== initialCount) {
      this.saveNotifications();
    }
  }

  // Suscripción a cambios
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.notifications); // Llamar inmediatamente con el estado actual
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Suscripción a toasts
  subscribeToToasts(callback: (toast: ToastNotification) => void): () => void {
    this.toastListeners.push(callback);
    
    return () => {
      this.toastListeners = this.toastListeners.filter(listener => listener !== callback);
    };
  }

  private notifyToastListeners(toast: ToastNotification): void {
    this.toastListeners.forEach(listener => listener(toast));
  }

  // Estadísticas
  getStats(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    today: number;
  } {
    const today = new Date().toDateString();
    
    return {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.isRead).length,
      byType: this.notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      today: this.notifications.filter(n => 
        new Date(n.createdAt).toDateString() === today
      ).length
    };
  }
}

interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'request' | 'approval';
  title: string;
  message: string;
  duration: number;
  createdAt: number;
}

export const notificationService = new NotificationService();
export type { Notification, NotificationConfig, ToastNotification };