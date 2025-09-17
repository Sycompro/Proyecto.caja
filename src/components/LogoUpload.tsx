import React, { useState, useRef } from 'react';
import { Upload, X, Image, Check } from 'lucide-react';

interface LogoUploadProps {
  onClose: () => void;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(() => 
    localStorage.getItem('companyLogo') || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('El archivo es demasiado grande. Máximo 2MB');
      return;
    }

    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      localStorage.setItem('companyLogo', result);
      setCurrentLogo(result);
      setUploading(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: result }));
      
      setTimeout(() => {
        alert('✅ Logo actualizado exitosamente');
        onClose();
      }, 500);
    };
    
    reader.onerror = () => {
      setUploading(false);
      alert('Error al cargar el archivo');
    };
    
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    if (confirm('¿Estás seguro de que quieres eliminar el logo actual?')) {
      localStorage.removeItem('companyLogo');
      setCurrentLogo('');
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: '' }));
      alert('✅ Logo eliminado exitosamente');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Image className="w-5 h-5 text-blue-600" />
            <span>Logo de la Empresa</span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Logo Preview */}
        {currentLogo && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Logo Actual:</p>
            <div className="relative bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
              <img
                src={currentLogo}
                alt="Logo actual"
                className="max-w-full max-h-32 mx-auto object-contain"
              />
              <button
                onClick={removeLogo}
                className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">
            {currentLogo ? 'Cambiar Logo:' : 'Subir Logo:'}
          </p>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-3">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 mt-2">Subiendo logo...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Arrastra tu logo aquí o{' '}
                      <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF hasta 2MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Recomendaciones:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Usa imágenes con fondo transparente (PNG)</li>
              <li>• Resolución recomendada: 200x60 píxeles</li>
              <li>• El logo se ajustará automáticamente</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoUpload;