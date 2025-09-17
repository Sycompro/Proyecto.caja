interface RealtimeEvent {
  type: 'notification' | 'request' | 'user' | 'printer' | 'system';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  userId?: string;
}

interface RealtimeConfig {
  enabled: boolean;
  pollInterval: number; // en milisegundos
  enabledEvents: string[];
  enableVisualIndicator: boolean;
  enableSoundNotifications: boolean;
}

class RealtimeService {
  private config: RealtimeConfig;
  private listeners: Map<string, ((event: RealtimeEvent) => void)[]> = new Map();
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastChecked: Map<string, string> = new Map();
  private isActive: boolean = true;

  constructor() {
    this.config = this.loadConfig();
    this.initializeRealtime();
    this.setupVisibilityHandling();
  }

  private loadConfig(): RealtimeConfig {
    const stored = localStorage.getItem('realtimeConfig');
    return stored ? JSON.parse(stored) : {
      enabled: true,
      pollInterval: 2000, // 2 segundos
      enabledEvents: ['notification', 'request', 'user', 'printer', 'system'],
      enableVisualIndicator: true,
      enableSoundNotifications: true
    };
  }

  updateConfig(newConfig: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('realtimeConfig', JSON.stringify(this.config));
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }
    
    if (newConfig.pollInterval) {
      this.restart();
    }
  }

  getConfig(): RealtimeConfig {
    return { ...this.config };
  }

  private initializeRealtime(): void {
    if (this.config.enabled) {
      this.start();
    }
  }

  start(): void {
    if (!this.config.enabled) return;

    // Polling para notificaciones
    this.startPolling('notifications', () => {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const lastCheck = this.lastChecked.get('notifications');
      const newNotifications = notifications.filter((n: any) => 
        !lastCheck || new Date(n.createdAt) > new Date(lastCheck)
      );
      
      if (newNotifications.length > 0) {
        this.lastChecked.set('notifications', new Date().toISOString());
        newNotifications.forEach((notification: any) => {
          this.emitEvent({
            type: 'notification',
            action: 'create',
            data: notification,
            timestamp: new Date().toISOString(),
            userId: notification.userId
          });
        });
      }
    });

    // Polling para solicitudes
    this.startPolling('requests', () => {
      const requests = JSON.parse(localStorage.getItem('printRequests') || '[]');
      const lastCheck = this.lastChecked.get('requests');
      const newRequests = requests.filter((r: any) => 
        !lastCheck || new Date(r.createdAt) > new Date(lastCheck) || 
        (r.processedAt && new Date(r.processedAt) > new Date(lastCheck))
      );
      
      if (newRequests.length > 0) {
        this.lastChecked.set('requests', new Date().toISOString());
        newRequests.forEach((request: any) => {
          this.emitEvent({
            type: 'request',
            action: request.processedAt ? 'update' : 'create',
            data: request,
            timestamp: new Date().toISOString(),
            userId: request.userId
          });
        });
      }
    });

    // Polling para usuarios
    this.startPolling('users', () => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const lastCheck = this.lastChecked.get('users');
      const currentTime = new Date().toISOString();
      
      // Verificar cambios en usuarios (esto es más complejo, se podría mejorar con timestamps)
      const usersString = JSON.stringify(users);
      const lastUsersString = localStorage.getItem('lastUsersSnapshot');
      
      if (lastUsersString && usersString !== lastUsersString) {
        localStorage.setItem('lastUsersSnapshot', usersString);
        this.emitEvent({
          type: 'user',
          action: 'update',
          data: users,
          timestamp: currentTime
        });
      } else if (!lastUsersString) {
        localStorage.setItem('lastUsersSnapshot', usersString);
      }
    });

    // Polling para impresoras
    this.startPolling('printers', () => {
      const printers = JSON.parse(localStorage.getItem('printers') || '[]');
      const printersString = JSON.stringify(printers);
      const lastPrintersString = localStorage.getItem('lastPrintersSnapshot');
      
      if (lastPrintersString && printersString !== lastPrintersString) {
        localStorage.setItem('lastPrintersSnapshot', printersString);
        this.emitEvent({
          type: 'printer',
          action: 'update',
          data: printers,
          timestamp: new Date().toISOString()
        });
      } else if (!lastPrintersString) {
        localStorage.setItem('lastPrintersSnapshot', printersString);
      }
    });

    console.log('🔄 Sistema de tiempo real iniciado');
  }

  stop(): void {
    this.pollIntervals.forEach((interval, key) => {
      clearInterval(interval);
    });
    this.pollIntervals.clear();
    console.log('⏹️ Sistema de tiempo real detenido');
  }

  restart(): void {
    this.stop();
    setTimeout(() => this.start(), 100);
  }

  private startPolling(key: string, callback: () => void): void {
    if (this.pollIntervals.has(key)) {
      clearInterval(this.pollIntervals.get(key)!);
    }

    const interval = setInterval(() => {
      if (this.isActive && this.config.enabled) {
        try {
          callback();
        } catch (error) {
          console.error(`Error en polling ${key}:`, error);
        }
      }
    }, this.config.pollInterval);

    this.pollIntervals.set(key, interval);
  }

  private emitEvent(event: RealtimeEvent): void {
    if (!this.config.enabledEvents.includes(event.type)) return;

    const typeListeners = this.listeners.get(event.type) || [];
    const allListeners = this.listeners.get('*') || [];
    
    [...typeListeners, ...allListeners].forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error en listener de tiempo real:', error);
      }
    });

    // Mostrar indicador visual si está habilitado
    if (this.config.enableVisualIndicator) {
      this.showRealtimeIndicator(event);
    }

    // Reproducir sonido si está habilitado
    if (this.config.enableSoundNotifications) {
      this.playRealtimeSound(event);
    }
  }

  private showRealtimeIndicator(event: RealtimeEvent): void {
    // Crear indicador visual temporal
    const indicator = document.createElement('div');
    indicator.className = `
      fixed top-4 left-4 z-50 px-3 py-2 rounded-lg shadow-lg backdrop-blur-xl
      text-white text-sm font-medium transform transition-all duration-300
      ${this.getIndicatorColor(event.type)}
    `;
    indicator.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-current rounded-full animate-pulse"></div>
        <span>${this.getIndicatorText(event)}</span>
      </div>
    `;

    document.body.appendChild(indicator);

    // Animar entrada
    setTimeout(() => {
      indicator.style.transform = 'translateX(0)';
      indicator.style.opacity = '1';
    }, 10);

    // Remover después de 3 segundos
    setTimeout(() => {
      indicator.style.transform = 'translateX(-100%)';
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }, 3000);
  }

  private getIndicatorColor(type: string): string {
    const colors = {
      notification: 'bg-blue-600/90',
      request: 'bg-purple-600/90',
      user: 'bg-green-600/90',
      printer: 'bg-orange-600/90',
      system: 'bg-gray-600/90'
    };
    return colors[type as keyof typeof colors] || 'bg-blue-600/90';
  }

  private getIndicatorText(event: RealtimeEvent): string {
    const texts = {
      notification: {
        create: '🔔 Nueva notificación'
      },
      request: {
        create: '📋 Nueva solicitud',
        update: '✅ Solicitud actualizada'
      },
      user: {
        update: '👤 Usuarios actualizados'
      },
      printer: {
        update: '🖨️ Impresoras actualizadas'
      },
      system: {
        update: '⚙️ Sistema actualizado'
      }
    };
    
    return texts[event.type as keyof typeof texts]?.[event.action as keyof any] || 'Actualización';
  }

  private playRealtimeSound(event: RealtimeEvent): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Diferentes tonos para diferentes tipos de eventos
      const frequencies = {
        notification: 800,
        request: 1000,
        user: 600,
        printer: 1200,
        system: 400
      };

      oscillator.frequency.setValueAtTime(
        frequencies[event.type as keyof typeof frequencies] || 800, 
        audioContext.currentTime
      );
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('No se pudo reproducir sonido de tiempo real:', error);
    }
  }

  private setupVisibilityHandling(): void {
    // Pausar cuando la pestaña no está visible para ahorrar recursos
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
      if (this.isActive) {
        console.log('🔄 Tiempo real reactivado');
      } else {
        console.log('⏸️ Tiempo real pausado (pestaña oculta)');
      }
    });

    // Pausar cuando la ventana pierde el foco
    window.addEventListener('blur', () => {
      this.isActive = false;
    });

    window.addEventListener('focus', () => {
      this.isActive = true;
    });
  }

  // API pública para suscribirse a eventos
  subscribe(eventType: string, callback: (event: RealtimeEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(callback);
    
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Suscribirse a todos los eventos
  subscribeToAll(callback: (event: RealtimeEvent) => void): () => void {
    return this.subscribe('*', callback);
  }

  // Forzar actualización manual
  forceUpdate(): void {
    this.lastChecked.clear();
    console.log('🔄 Forzando actualización de tiempo real...');
  }

  // Obtener estadísticas del sistema
  getStats(): {
    isActive: boolean;
    config: RealtimeConfig;
    activePolls: number;
    lastChecked: Record<string, string>;
  } {
    return {
      isActive: this.isActive,
      config: this.config,
      activePolls: this.pollIntervals.size,
      lastChecked: Object.fromEntries(this.lastChecked)
    };
  }
}

export const realtimeService = new RealtimeService();
export type { RealtimeEvent, RealtimeConfig };