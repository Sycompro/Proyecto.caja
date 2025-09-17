interface PrinterConfig {
  id: string;
  name: string;
  type: 'thermal' | 'laser' | 'inkjet';
  isDefault: boolean;
  isActive: boolean;
  paperSize: 'A4' | '80mm' | '58mm';
  createdAt: string;
}

interface PrintDocument {
  id: string;
  requestId: string;
  content: string;
  format: 'html' | 'text' | 'pdf';
  createdAt: string;
  printerId?: string;
}

interface CashRegisterDocument {
  requestId: string;
  userName: string;
  amount: number;
  reason: string;
  processedBy: string;
  processedAt: string;
  companyLogo?: string;
}

interface PrintTemplate {
  id: string;
  name: string;
  header: {
    showLogo: boolean;
    showCompanyName: boolean;
    companyName: string;
    showDate: boolean;
    showTime: boolean;
    customHeader: string;
  };
  content: {
    showRequestId: boolean;
    showUserName: boolean;
    showAmount: boolean;
    showReason: boolean;
    showProcessedBy: boolean;
    showProcessedAt: boolean;
    customFields: Array<{
      id: string;
      label: string;
      value: string;
      enabled: boolean;
    }>;
  };
  footer: {
    showSignatures: boolean;
    showBarcode: boolean;
    showTimestamp: boolean;
    customFooter: string;
    showWarning: boolean;
    warningText: string;
  };
  styling: {
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: 'courier' | 'arial' | 'times';
    paperSize: 'A4' | '80mm' | '58mm';
    margins: 'small' | 'medium' | 'large';
    showBorders: boolean;
    headerStyle: 'simple' | 'bordered' | 'highlighted';
  };
  language: {
    locale: 'es' | 'en';
    currency: 'USD' | 'EUR' | 'MXN' | 'COP';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
  };
}

class PrintService {
  private printers: PrinterConfig[] = [];

  constructor() {
    this.loadPrinters();
  }

  // Gestión de impresoras
  loadPrinters(): PrinterConfig[] {
    const stored = localStorage.getItem('printers');
    this.printers = stored ? JSON.parse(stored) : [];
    return this.printers;
  }

  savePrinters(): void {
    localStorage.setItem('printers', JSON.stringify(this.printers));
  }

  addPrinter(printer: Omit<PrinterConfig, 'id' | 'createdAt'>): PrinterConfig {
    const newPrinter: PrinterConfig = {
      ...printer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    // Si es la primera impresora o se marca como predeterminada, actualizar otras
    if (this.printers.length === 0 || printer.isDefault) {
      this.printers.forEach(p => p.isDefault = false);
    }

    this.printers.push(newPrinter);
    this.savePrinters();
    return newPrinter;
  }

  updatePrinter(id: string, updates: Partial<PrinterConfig>): boolean {
    const index = this.printers.findIndex(p => p.id === id);
    if (index === -1) return false;

    // Si se marca como predeterminada, desmarcar otras
    if (updates.isDefault) {
      this.printers.forEach(p => p.isDefault = false);
    }

    this.printers[index] = { ...this.printers[index], ...updates };
    this.savePrinters();
    return true;
  }

  deletePrinter(id: string): boolean {
    const index = this.printers.findIndex(p => p.id === id);
    if (index === -1) return false;

    const wasDefault = this.printers[index].isDefault;
    this.printers.splice(index, 1);

    // Si era la predeterminada y hay otras, marcar la primera como predeterminada
    if (wasDefault && this.printers.length > 0) {
      this.printers[0].isDefault = true;
    }

    this.savePrinters();
    return true;
  }

  getDefaultPrinter(): PrinterConfig | null {
    return this.printers.find(p => p.isDefault && p.isActive) || null;
  }

  getAllPrinters(): PrinterConfig[] {
    return [...this.printers];
  }

  // Obtener plantilla de impresión actual
  getCurrentTemplate(): PrintTemplate {
    const stored = localStorage.getItem('currentPrintTemplate');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Plantilla predeterminada
    return {
      id: 'default',
      name: 'Plantilla Predeterminada',
      header: {
        showLogo: true,
        showCompanyName: true,
        companyName: 'Sistema de Caja Registradora',
        showDate: true,
        showTime: true,
        customHeader: ''
      },
      content: {
        showRequestId: true,
        showUserName: true,
        showAmount: true,
        showReason: true,
        showProcessedBy: true,
        showProcessedAt: true,
        customFields: []
      },
      footer: {
        showSignatures: true,
        showBarcode: true,
        showTimestamp: true,
        customFooter: '',
        showWarning: true,
        warningText: '⚠️ IMPORTANTE: Este documento autoriza la apertura de caja registradora'
      },
      styling: {
        fontSize: 'medium',
        fontFamily: 'courier',
        paperSize: '80mm',
        margins: 'medium',
        showBorders: true,
        headerStyle: 'bordered'
      },
      language: {
        locale: 'es',
        currency: 'USD',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      }
    };
  }

  // Generación de documentos
  generateCashRegisterDocument(data: CashRegisterDocument): PrintDocument {
    const template = this.getCurrentTemplate();
    
    const document: PrintDocument = {
      id: Date.now().toString(),
      requestId: data.requestId,
      content: this.generateDocumentContent(data, template),
      format: 'html',
      createdAt: new Date().toISOString()
    };

    // Guardar documento generado
    this.saveDocument(document);
    return document;
  }

  private generateDocumentContent(data: CashRegisterDocument, template: PrintTemplate): string {
    const formatDate = (date: Date) => {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: template.language.timeFormat === '24h' ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12: template.language.timeFormat === '12h'
      };
      return date.toLocaleDateString(template.language.locale, options);
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(template.language.locale, {
        style: 'currency',
        currency: template.language.currency
      }).format(amount);
    };

    const fontSizeMap = {
      small: '12px',
      medium: '14px',
      large: '16px'
    };

    const fontFamilyMap = {
      courier: "'Courier New', monospace",
      arial: "Arial, sans-serif",
      times: "'Times New Roman', serif"
    };

    const marginMap = {
      small: '10px',
      medium: '20px',
      large: '30px'
    };

    return `
<!DOCTYPE html>
<html lang="${template.language.locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprobante de Apertura de Caja</title>
    <style>
        body {
            font-family: ${fontFamilyMap[template.styling.fontFamily]};
            font-size: ${fontSizeMap[template.styling.fontSize]};
            margin: ${marginMap[template.styling.margins]};
            padding: 0;
            background: white;
            color: black;
            line-height: 1.4;
            width: ${template.styling.paperSize === 'A4' ? '210mm' : template.styling.paperSize};
        }
        .header {
            text-align: center;
            ${template.styling.headerStyle === 'bordered' ? 'border-bottom: 2px solid #000;' : ''}
            ${template.styling.headerStyle === 'highlighted' ? 'background: #f0f0f0;' : ''}
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .logo {
            max-width: 150px;
            max-height: 60px;
            margin-bottom: 10px;
        }
        .company-name {
            font-size: ${template.styling.fontSize === 'large' ? '20px' : '18px'};
            font-weight: bold;
            margin-bottom: 5px;
        }
        .document-title {
            font-size: ${template.styling.fontSize === 'large' ? '18px' : '16px'};
            font-weight: bold;
            margin-top: 15px;
        }
        .content {
            margin: 20px 0;
        }
        .field {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
            ${template.styling.showBorders ? 'border-bottom: 1px dotted #ccc; padding-bottom: 4px;' : ''}
        }
        .field-label {
            font-weight: bold;
            width: 40%;
        }
        .field-value {
            width: 55%;
            text-align: right;
        }
        .amount {
            font-size: ${template.styling.fontSize === 'large' ? '22px' : '20px'};
            font-weight: bold;
            text-align: center;
            border: 2px solid #000;
            padding: 10px;
            margin: 20px 0;
        }
        .reason-box {
            border: 1px solid #000;
            padding: 10px;
            margin: 15px 0;
            min-height: 60px;
        }
        .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
            font-size: ${template.styling.fontSize === 'large' ? '14px' : '12px'};
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: ${template.styling.fontSize === 'large' ? '14px' : '12px'};
            ${template.styling.showBorders ? 'border-top: 1px solid #000; padding-top: 10px;' : ''}
        }
        .barcode {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            margin: 10px 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 8px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .custom-field {
            background: #f8f9fa;
            padding: 4px 8px;
            margin: 4px 0;
            border-radius: 3px;
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    ${template.header.showLogo || template.header.showCompanyName ? `
    <div class="header">
        ${template.header.showLogo ? `<img src="${data.companyLogo || ''}" alt="Logo" class="logo">` : ''}
        ${template.header.showCompanyName ? `<div class="company-name">${template.header.companyName}</div>` : ''}
        <div class="document-title">COMPROBANTE DE APERTURA DE CAJA</div>
        ${template.header.customHeader ? `<div style="margin-top: 10px;">${template.header.customHeader}</div>` : ''}
    </div>
    ` : ''}

    <div class="content">
        ${template.content.showRequestId ? `
        <div class="field">
            <span class="field-label">Solicitud #:</span>
            <span class="field-value">${data.requestId.slice(-8).toUpperCase()}</span>
        </div>
        ` : ''}
        
        ${template.header.showDate || template.header.showTime ? `
        <div class="field">
            <span class="field-label">Fecha y Hora:</span>
            <span class="field-value">${formatDate(new Date(data.processedAt))}</span>
        </div>
        ` : ''}
        
        ${template.content.showUserName ? `
        <div class="field">
            <span class="field-label">Solicitante:</span>
            <span class="field-value">${data.userName}</span>
        </div>
        ` : ''}
        
        ${template.content.showProcessedBy ? `
        <div class="field">
            <span class="field-label">Autorizado por:</span>
            <span class="field-value">${data.processedBy}</span>
        </div>
        ` : ''}

        ${template.content.customFields.filter(f => f.enabled).map(field => `
        <div class="field custom-field">
            <span class="field-label">${field.label}:</span>
            <span class="field-value">${field.value}</span>
        </div>
        `).join('')}

        ${template.content.showAmount ? `
        <div class="amount">
            MONTO AUTORIZADO: ${formatCurrency(data.amount)}
        </div>
        ` : ''}

        ${template.content.showReason ? `
        <div>
            <strong>MOTIVO DE APERTURA:</strong>
            <div class="reason-box">
                ${data.reason}
            </div>
        </div>
        ` : ''}

        ${template.footer.showSignatures ? `
        <div class="signatures">
            <div class="signature-box">
                <div class="signature-line">
                    Firma del Solicitante<br>
                    ${data.userName}
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    Firma del Autorizador<br>
                    ${data.processedBy}
                </div>
            </div>
        </div>
        ` : ''}
    </div>

    ${template.footer.showBarcode || template.footer.showTimestamp || template.footer.customFooter || template.footer.showWarning ? `
    <div class="footer">
        ${template.footer.showBarcode ? `
        <div class="barcode">
            ||||| ${data.requestId} |||||
        </div>
        ` : ''}
        
        ${template.footer.showTimestamp ? `
        <div>
            Documento generado automáticamente<br>
            ${formatDate(new Date())}
        </div>
        ` : ''}
        
        ${template.footer.customFooter ? `
        <div style="margin-top: 10px;">
            ${template.footer.customFooter}
        </div>
        ` : ''}
        
        ${template.footer.showWarning ? `
        <div class="warning">
            ${template.footer.warningText}
        </div>
        ` : ''}
    </div>
    ` : ''}
</body>
</html>`;
  }

  private saveDocument(document: PrintDocument): void {
    const documents = JSON.parse(localStorage.getItem('printDocuments') || '[]');
    documents.push(document);
    localStorage.setItem('printDocuments', JSON.stringify(documents));
  }

  // Funciones de impresión
  async printDocument(document: PrintDocument, printerId?: string): Promise<boolean> {
    try {
      const printer = printerId 
        ? this.printers.find(p => p.id === printerId)
        : this.getDefaultPrinter();

      if (!printer) {
        throw new Error('No hay impresora disponible');
      }

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión');
      }

      printWindow.document.write(document.content);
      printWindow.document.close();

      // Esperar a que cargue el contenido
      await new Promise(resolve => {
        printWindow.onload = resolve;
        setTimeout(resolve, 1000); // Fallback
      });

      // Imprimir
      printWindow.print();

      // Cerrar ventana después de imprimir
      setTimeout(() => {
        printWindow.close();
      }, 2000);

      // Registrar impresión
      this.logPrintJob(document.id, printer.id);

      return true;
    } catch (error) {
      console.error('Error al imprimir:', error);
      return false;
    }
  }

  async printCashRegisterDocument(data: CashRegisterDocument, printerId?: string): Promise<boolean> {
    try {
      // Generar documento
      const document = this.generateCashRegisterDocument(data);
      
      // Imprimir documento
      const success = await this.printDocument(document, printerId);
      
      if (success) {
        // Mostrar confirmación usando notificaciones internas
        this.showPrintConfirmation(data);
      }
      
      return success;
    } catch (error) {
      console.error('Error al procesar impresión:', error);
      return false;
    }
  }

  private logPrintJob(documentId: string, printerId: string): void {
    const logs = JSON.parse(localStorage.getItem('printLogs') || '[]');
    logs.push({
      id: Date.now().toString(),
      documentId,
      printerId,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
    localStorage.setItem('printLogs', JSON.stringify(logs));
  }

  private showPrintConfirmation(data: CashRegisterDocument): void {
    const printer = this.getDefaultPrinter();
    const template = this.getCurrentTemplate();
    
    // Usar notificaciones internas en lugar de alert
    import('./notificationService').then(({ notificationService }) => {
      notificationService.addNotification({
        type: 'success',
        title: '🖨️ Documento Impreso',
        message: `Comprobante #${data.requestId.slice(-8)} generado e impreso correctamente en ${printer?.name || 'impresora predeterminada'}`
      });
    });
  }

  // Obtener documentos generados
  getDocuments(): PrintDocument[] {
    return JSON.parse(localStorage.getItem('printDocuments') || '[]');
  }

  // Obtener logs de impresión
  getPrintLogs(): any[] {
    return JSON.parse(localStorage.getItem('printLogs') || '[]');
  }

  // Previsualizar documento
  previewDocument(document: PrintDocument): void {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(document.content);
      previewWindow.document.close();
    }
  }
}

export const printService = new PrintService();
export type { PrinterConfig, PrintDocument, CashRegisterDocument, PrintTemplate };