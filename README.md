# Proyecto.caja 📦🔓
Apertura remota de caja registradora vía comando de voz / pulsador / API.

## 📌 Índice
1. Descripción general  
2. Características  
3. Instalación  
4. Uso  
5. Esquema de conexión  
6. Tecnologías utilizadas  
7. Contribuir  
8. Licencia  

## 1. Descripción general
`Proyecto.caja` permite abrir el cajón portamonedas de una impresora térmica (o una caja registradora convencional) **sin tocar la tecla física del equipo**, utilizando:
- Un botón inalámbrico (ESP32 / Arduino + RF).  
- Comando de voz a través de Google Assistant / Alexa (IFTTT o webhook).  
- Petición HTTP a una API ligera corriendo en Raspberry Pi.  

Ideal para comercios que quieran **minimizar contacto físico** o integrar la apertura en su propio POS.

## 2. Características ✨
- Apertura inmediata (&lt; 300 ms).  
- Seguridad: token JWT o clave de acceso por request.  
- Registro de eventos en archivo `.csv` con timestamp.  
- Interfaz web simple para testeo.  
- Código modular: fácil agregar nuevos “triggers” (Telegram, Slack, etc.).  

## 3. Instalación 🔧
### Requisitos hardware
- Caja registradora con conector RJ12 o jack 12 V.  
- Relay de estado sólido o transistor TIP120.  
- Microcontrolador ESP32 (Wi-Fi integrado) o Arduino + módulo Wi-Fi.  
- Fuente 12 V / 2 A.  

### Requisitos software
- Python ≥ 3.8 (si usas Raspberry Pi).  
- PlatformIO o Arduino IDE.  
- (Opcional) Ngrok para exponer tu API a Internet.  

### Pasos
1. Clona el repo  
   ```bash
   git clone https://github.com/Sycompro/Proyecto.caja.git
   cd Proyecto.caja
