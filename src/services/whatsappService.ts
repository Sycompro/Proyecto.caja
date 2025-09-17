interface WhatsAppConfig {
  phoneNumber: string;
  accessToken: string;
  phoneNumberId: string;
  adminPhoneNumber: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  isProduction: boolean;
  enableWebhook: boolean;
  messageTemplates: {
    newRequest: string;
    approval: string;
    rejection: string;
  };
}

interface NotificationData {
  requestId: string;
  userName: string;
  amount: number;
  reason: string;
  processedBy: string;
  processedAt: string;
}

interface NewRequestNotificationData {
  requestId: string;
  userName: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface WebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text: {
            body: string;
          };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private readonly API_VERSION = 'v18.0';
  private readonly BASE_URL = 'https://graph.facebook.com';

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): WhatsAppConfig {
    return {
      phoneNumber: localStorage.getItem('whatsapp_manager_phone') || '',
      adminPhoneNumber: localStorage.getItem('whatsapp_admin_phone') || '',
      accessToken: localStorage.getItem('whatsapp_access_token') || '',
      phoneNumberId: localStorage.getItem('whatsapp_phone_number_id') || '',
      businessAccountId: localStorage.getItem('whatsapp_business_account_id') || '',
      webhookVerifyToken: localStorage.getItem('whatsapp_webhook_verify_token') || '',
      isProduction: localStorage.getItem('whatsapp_is_production') === 'true',
      enableWebhook: localStorage.getItem('whatsapp_enable_webhook') === 'true',
      messageTemplates: {
        newRequest: localStorage.getItem('whatsapp_template_new_request') || 'new_request_template',
        approval: localStorage.getItem('whatsapp_template_approval') || 'approval_template',
        rejection: localStorage.getItem('whatsapp_template_rejection') || 'rejection_template'
      }
    };
  }

  // Configuración del servicio
  updateConfig(newConfig: Partial<WhatsAppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Guardar en localStorage
    Object.entries(newConfig).forEach(([key, value]) => {
      if (key === 'messageTemplates' && typeof value === 'object') {
        Object.entries(value).forEach(([templateKey, templateValue]) => {
          localStorage.setItem(`whatsapp_template_${templateKey}`, templateValue as string);
        });
      } else {
        localStorage.setItem(`whatsapp_${this.camelToSnake(key)}`, String(value));
      }
    });
  }

  getConfig(): WhatsAppConfig {
    return { ...this.config };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Validación de configuración
  async validateConfiguration(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.config.accessToken) {
      errors.push('Access Token es requerido');
    }

    if (!this.config.phoneNumberId) {
      errors.push('Phone Number ID es requerido');
    }

    if (!this.config.phoneNumber) {
      errors.push('Número de teléfono del gerente es requerido');
    }

    if (!this.config.adminPhoneNumber) {
      errors.push('Número de teléfono del admin es requerido');
    }

    // Validar formato de números de teléfono
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (this.config.phoneNumber && !phoneRegex.test(this.config.phoneNumber)) {
      errors.push('Formato de número de gerente inválido (debe incluir código de país)');
    }

    if (this.config.adminPhoneNumber && !phoneRegex.test(this.config.adminPhoneNumber)) {
      errors.push('Formato de número de admin inválido (debe incluir código de país)');
    }

    // Validar conexión con la API si está en producción
    if (this.config.isProduction && this.config.accessToken && this.config.phoneNumberId) {
      try {
        await this.testConnection();
      } catch (error) {
        errors.push(`Error de conexión con WhatsApp API: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Probar conexión con WhatsApp API
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.config.phoneNumberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return true;
    } catch (error) {
      console.error('Error al probar conexión WhatsApp:', error);
      throw error;
    }
  }

  // Enviar mensaje de texto
  async sendTextMessage(to: string, message: string): Promise<WhatsAppResponse | null> {
    if (!this.config.isProduction) {
      console.log('📱 [MODO DESARROLLO] Mensaje WhatsApp:', { to, message });
      this.showSimulatedMessage(to, message);
      return null;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''), // Remover caracteres no numéricos
            type: 'text',
            text: {
              body: message
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: WhatsAppResponse = await response.json();
      console.log('✅ Mensaje WhatsApp enviado:', result);
      
      // Registrar el envío
      this.logMessageSent(to, message, result.messages[0]?.id);
      
      return result;
    } catch (error) {
      console.error('❌ Error al enviar mensaje WhatsApp:', error);
      this.showErrorNotification(error as Error);
      throw error;
    }
  }

  // Enviar mensaje usando plantilla
  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    parameters: string[]
  ): Promise<WhatsAppResponse | null> {
    if (!this.config.isProduction) {
      console.log('📱 [MODO DESARROLLO] Plantilla WhatsApp:', { to, templateName, parameters });
      this.showSimulatedTemplate(to, templateName, parameters);
      return null;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''),
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: 'es' // Español por defecto
              },
              components: [
                {
                  type: 'body',
                  parameters: parameters.map(param => ({
                    type: 'text',
                    text: param
                  }))
                }
              ]
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: WhatsAppResponse = await response.json();
      console.log('✅ Plantilla WhatsApp enviada:', result);
      
      this.logMessageSent(to, `Template: ${templateName}`, result.messages[0]?.id);
      
      return result;
    } catch (error) {
      console.error('❌ Error al enviar plantilla WhatsApp:', error);
      this.showErrorNotification(error as Error);
      throw error;
    }
  }

  // Notificaciones específicas del sistema
  async sendNewRequestNotification(data: NewRequestNotificationData): Promise<boolean> {
    try {
      const message = this.formatNewRequestMessage(data);
      
      if (this.config.messageTemplates.newRequest && this.config.isProduction) {
        // Usar plantilla si está configurada
        await this.sendTemplateMessage(
          this.config.adminPhoneNumber,
          this.config.messageTemplates.newRequest,
          [
            data.requestId.slice(-6),
            data.userName,
            data.amount.toFixed(2),
            data.reason,
            new Date(data.createdAt).toLocaleString('es-ES')
          ]
        );
      } else {
        // Usar mensaje de texto
        await this.sendTextMessage(this.config.adminPhoneNumber, message);
      }

      this.showSuccessNotification('Nueva solicitud notificada al admin');
      return true;
    } catch (error) {
      console.error('Error al notificar nueva solicitud:', error);
      return false;
    }
  }

  async sendApprovalNotification(data: NotificationData): Promise<boolean> {
    try {
      const message = this.formatApprovalMessage(data);
      
      if (this.config.messageTemplates.approval && this.config.isProduction) {
        // Usar plantilla si está configurada
        await this.sendTemplateMessage(
          this.config.phoneNumber,
          this.config.messageTemplates.approval,
          [
            data.requestId.slice(-6),
            data.userName,
            data.amount.toFixed(2),
            data.reason,
            data.processedBy,
            new Date(data.processedAt).toLocaleString('es-ES')
          ]
        );
      } else {
        // Usar mensaje de texto
        await this.sendTextMessage(this.config.phoneNumber, message);
      }

      this.showSuccessNotification('Aprobación notificada al gerente');
      return true;
    } catch (error) {
      console.error('Error al notificar aprobación:', error);
      return false;
    }
  }

  async sendRejectionNotification(data: NotificationData): Promise<boolean> {
    try {
      const message = this.formatRejectionMessage(data);
      
      if (this.config.messageTemplates.rejection && this.config.isProduction) {
        // Usar plantilla si está configurada
        await this.sendTemplateMessage(
          this.config.phoneNumber,
          this.config.messageTemplates.rejection,
          [
            data.requestId.slice(-6),
            data.userName,
            data.amount.toFixed(2),
            data.reason,
            data.processedBy,
            new Date(data.processedAt).toLocaleString('es-ES')
          ]
        );
      } else {
        // Usar mensaje de texto
        await this.sendTextMessage(this.config.phoneNumber, message);
      }

      this.showSuccessNotification('Rechazo notificado al gerente');
      return true;
    } catch (error) {
      console.error('Error al notificar rechazo:', error);
      return false;
    }
  }

  // Formateo de mensajes
  private formatNewRequestMessage(data: NewRequestNotificationData): string {
    const companyName = localStorage.getItem('companyName') || 'Sistema de Caja';
    
    return `🔔 *${companyName.toUpperCase()}*
*NUEVA SOLICITUD DE CAJA*

📋 *Detalles:*
• ID: #${data.requestId.slice(-6)}
• Solicitante: ${data.userName}
• Monto: $${data.amount.toFixed(2)}
• Motivo: ${data.reason}

🕐 *Fecha:* ${new Date(data.createdAt).toLocaleString('es-ES')}

⏳ *Estado:* Pendiente de aprobación

🔗 Ingresa al sistema para revisar y procesar esta solicitud.

_Mensaje automático del sistema_`;
  }

  private formatApprovalMessage(data: NotificationData): string {
    const companyName = localStorage.getItem('companyName') || 'Sistema de Caja';
    
    return `✅ *${companyName.toUpperCase()}*
*SOLICITUD APROBADA*

📋 *Detalles:*
• ID: #${data.requestId.slice(-6)}
• Solicitante: ${data.userName}
• Monto: $${data.amount.toFixed(2)}
• Motivo: ${data.reason}

👤 *Autorizado por:* ${data.processedBy}
🕐 *Fecha:* ${new Date(data.processedAt).toLocaleString('es-ES')}

✅ La caja registradora ha sido abierta exitosamente.

_Mensaje automático del sistema_`;
  }

  private formatRejectionMessage(data: NotificationData): string {
    const companyName = localStorage.getItem('companyName') || 'Sistema de Caja';
    
    return `❌ *${companyName.toUpperCase()}*
*SOLICITUD RECHAZADA*

📋 *Detalles:*
• ID: #${data.requestId.slice(-6)}
• Solicitante: ${data.userName}
• Monto: $${data.amount.toFixed(2)}
• Motivo original: ${data.reason}

👤 *Rechazado por:* ${data.processedBy}
🕐 *Fecha:* ${new Date(data.processedAt).toLocaleString('es-ES')}

❌ La solicitud ha sido denegada.

_Mensaje automático del sistema_`;
  }

  // Webhook para recibir mensajes
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      console.log('✅ Webhook verificado correctamente');
      return challenge;
    }
    console.log('❌ Error en verificación de webhook');
    return null;
  }

  processWebhookMessage(body: WebhookMessage): void {
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    body.entry.forEach(entry => {
      entry.changes.forEach(change => {
        if (change.field === 'messages') {
          const value = change.value;
          
          // Procesar mensajes entrantes
          if (value.messages) {
            value.messages.forEach(message => {
              this.handleIncomingMessage(message, value.contacts?.[0]);
            });
          }
          
          // Procesar estados de mensajes
          if (value.statuses) {
            value.statuses.forEach(status => {
              this.handleMessageStatus(status);
            });
          }
        }
      });
    });
  }

  private handleIncomingMessage(message: any, contact: any): void {
    console.log('📨 Mensaje entrante:', message);
    
    // Registrar mensaje recibido
    this.logMessageReceived(message.from, message.text?.body || '', message.id);
    
    // Notificar al sistema
    this.showIncomingMessageNotification(contact?.profile?.name || message.from, message.text?.body || '');
  }

  private handleMessageStatus(status: any): void {
    console.log('📊 Estado de mensaje:', status);
    
    // Actualizar estado del mensaje en logs
    this.updateMessageStatus(status.id, status.status);
  }

  // Gestión de logs
  private logMessageSent(to: string, message: string, messageId?: string): void {
    const logs = JSON.parse(localStorage.getItem('whatsappLogs') || '[]');
    logs.push({
      id: messageId || Date.now().toString(),
      type: 'sent',
      to,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    localStorage.setItem('whatsappLogs', JSON.stringify(logs));
  }

  private logMessageReceived(from: string, message: string, messageId: string): void {
    const logs = JSON.parse(localStorage.getItem('whatsappLogs') || '[]');
    logs.push({
      id: messageId,
      type: 'received',
      from,
      message,
      timestamp: new Date().toISOString(),
      status: 'received'
    });
    localStorage.setItem('whatsappLogs', JSON.stringify(logs));
  }

  private updateMessageStatus(messageId: string, status: string): void {
    const logs = JSON.parse(localStorage.getItem('whatsappLogs') || '[]');
    const logIndex = logs.findIndex((log: any) => log.id === messageId);
    if (logIndex !== -1) {
      logs[logIndex].status = status;
      logs[logIndex].updatedAt = new Date().toISOString();
      localStorage.setItem('whatsappLogs', JSON.stringify(logs));
    }
  }

  getLogs(): any[] {
    return JSON.parse(localStorage.getItem('whatsappLogs') || '[]');
  }

  // Notificaciones internas
  private showSimulatedMessage(to: string, message: string): void {
    import('./notificationService').then(({ notificationService }) => {
      notificationService.addNotification({
        type: 'info',
        title: '📱 WhatsApp (Desarrollo)',
        message: `Mensaje simulado enviado a ${to}: ${message.substring(0, 50)}...`
      });
    });
  }

  private showSimulatedTemplate(to: string, templateName: string, parameters: string[]): void {
    import('./notificationService').then(({ notificationService }) => {
      notificationService.addNotification({
        type: 'info',
        title: '📱 WhatsApp Template (Desarrollo)',
        message: `Plantilla "${templateName}" simulada para ${to}`
      });
    });
  }

  private showSuccessNotification(message: string): void {
    import('./notificationService').then(({ notificationService }) => {
      notificationService.addNotification({
        type: 'success',
        title: '📱 WhatsApp Enviado',
        message
      });
    });
  }

  private showErrorNotification(error: Error): void {
    import('./notificationService').then(({ notificationService }) => {
      notificationService.addNotification({
        type: 'error',
        title: '❌ Error WhatsApp',
        message: `Error al enviar: ${error.message}`
      });
    });
  }

  private showIncomingMessageNotification(from: string, message: string): void {
    import('./notificationService').then(({ notificationService }) => {
      notificationService.addNotification({
        type: 'info',
        title: '📨 Mensaje WhatsApp Recibido',
        message: `De ${from}: ${message.substring(0, 50)}...`
      });
    });
  }

  // Obtener estadísticas
  getStats(): {
    totalSent: number;
    totalReceived: number;
    deliveryRate: number;
    lastActivity: string | null;
  } {
    const logs = this.getLogs();
    const sent = logs.filter((log: any) => log.type === 'sent');
    const received = logs.filter((log: any) => log.type === 'received');
    const delivered = logs.filter((log: any) => log.status === 'delivered');
    
    return {
      totalSent: sent.length,
      totalReceived: received.length,
      deliveryRate: sent.length > 0 ? (delivered.length / sent.length) * 100 : 0,
      lastActivity: logs.length > 0 ? logs[logs.length - 1].timestamp : null
    };
  }
}

export const whatsappService = new WhatsAppService();
export type { 
  NotificationData, 
  WhatsAppConfig, 
  NewRequestNotificationData, 
  WhatsAppResponse,
  WebhookMessage 
};