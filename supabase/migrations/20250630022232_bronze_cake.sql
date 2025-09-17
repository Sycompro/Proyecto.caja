/*
  # Sistema de Gestión de Caja Registradora - Esquema Completo

  1. Funciones auxiliares
    - Función para actualizar updated_at automáticamente
    - Función para manejar nuevos usuarios de auth

  2. Tablas principales
    - `profiles` - Perfiles de usuario vinculados a auth.users
    - `print_requests` - Solicitudes de apertura de caja
    - `app_settings` - Configuración de la aplicación
    - `printers` - Configuración de impresoras
    - `print_logs` - Logs de impresión
    - `notifications` - Sistema de notificaciones
    - `cameras` - Configuración de cámaras IP
    - `camera_sessions` - Sesiones de monitoreo por cámara

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso por rol (admin/user)
    - Triggers para auditoría

  4. Datos iniciales
    - Configuración por defecto
    - Impresora principal
    - Índices para rendimiento
*/

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de solicitudes de impresión
CREATE TABLE IF NOT EXISTS print_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by TEXT,
    notes TEXT
);

-- Tabla de configuración de la aplicación
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT
);

-- Tabla de impresoras
CREATE TABLE IF NOT EXISTS printers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('thermal', 'laser', 'inkjet')),
    paper_size TEXT NOT NULL CHECK (paper_size IN ('A4', '80mm', '58mm')),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logs de impresión
CREATE TABLE IF NOT EXISTS print_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES print_requests(id) ON DELETE CASCADE,
    printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
    document_content TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'request', 'approval')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB
);

-- Tabla de cámaras
CREATE TABLE IF NOT EXISTS cameras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ip', 'usb', 'rtsp')),
    is_active BOOLEAN DEFAULT true,
    username TEXT,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sesiones de cámara
CREATE TABLE IF NOT EXISTS camera_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_id UUID REFERENCES print_requests(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES cameras(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    recordings TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    metadata JSONB
);

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_sessions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar conflictos)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can see all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own requests" ON print_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON print_requests;
DROP POLICY IF EXISTS "Admins can manage print requests" ON print_requests;
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can view printers" ON printers;
DROP POLICY IF EXISTS "Admins can manage printers" ON printers;
DROP POLICY IF EXISTS "Users can view own print logs" ON print_logs;
DROP POLICY IF EXISTS "Admins can view all print logs" ON print_logs;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage cameras" ON cameras;
DROP POLICY IF EXISTS "Users can view own camera sessions" ON camera_sessions;
DROP POLICY IF EXISTS "Admins can manage camera sessions" ON camera_sessions;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can see all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para print_requests
CREATE POLICY "Users can view own requests" ON print_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON print_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage print requests" ON print_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para app_settings
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para printers
CREATE POLICY "Users can view printers" ON printers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage printers" ON printers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para print_logs
CREATE POLICY "Users can view own print logs" ON print_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM print_requests 
            WHERE id = print_logs.request_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all print logs" ON print_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para cameras
CREATE POLICY "Admins can manage cameras" ON cameras
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas para camera_sessions
CREATE POLICY "Users can view own camera sessions" ON camera_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage camera sessions" ON camera_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_printers_updated_at ON printers;
DROP TRIGGER IF EXISTS update_cameras_updated_at ON cameras;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_printers_updated_at
    BEFORE UPDATE ON printers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cameras_updated_at
    BEFORE UPDATE ON cameras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para manejar nuevos usuarios
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insertar configuración inicial
INSERT INTO app_settings (setting_key, setting_value) VALUES
    ('company_name', 'Sistema de Caja Registradora'),
    ('whatsapp_enabled', 'false'),
    ('camera_monitoring_enabled', 'false'),
    ('auto_print_enabled', 'true'),
    ('notification_retention_days', '30')
ON CONFLICT (setting_key) DO NOTHING;

-- Insertar impresora por defecto si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM printers WHERE name = 'Impresora Principal') THEN
        INSERT INTO printers (name, type, paper_size, is_default, is_active) 
        VALUES ('Impresora Principal', 'thermal', '80mm', true, true);
    END IF;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_print_requests_user_id ON print_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_print_requests_status ON print_requests(status);
CREATE INDEX IF NOT EXISTS idx_print_requests_created_at ON print_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_camera_sessions_user_id ON camera_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_camera_sessions_request_id ON camera_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_printers_is_default ON printers(is_default);
CREATE INDEX IF NOT EXISTS idx_cameras_is_active ON cameras(is_active);