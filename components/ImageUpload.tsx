
import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onUpload: (base64: string) => void;
  onStartFromScratch: () => void;
  isLoading: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, onStartFromScratch, isLoading }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 glass-effect rounded-3xl border border-slate-700/50 text-center">
      <h2 className="text-2xl font-bold mb-2">Carregue seu Criativo</h2>
      <p className="text-slate-400 mb-8">Analise qualquer imagem de anúncio para gerar variações de alta conversão.</p>
      
      <div 
        onClick={() => !isLoading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group cursor-pointer border-2 border-dashed transition-all duration-300 rounded-2xl p-10 
          ${preview ? 'border-purple-500/50' : isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-purple-500/50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {preview ? (
          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            {!isLoading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-white font-medium">Trocar Imagem</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-purple-900/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="text-slate-200 font-semibold">Clique para carregar ou arraste e solte</p>
              <p className="text-slate-500 text-sm mt-1">PNG, JPG ou WEBP até 10MB</p>
            </div>
          </div>
        )}
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-purple-400 font-medium animate-pulse">Analisando inteligência criativa...</p>
        </div>
      )}

      {!isLoading && !preview && (
        <div className="mt-10 pt-6 border-t border-slate-800/50">
          <p className="text-slate-500 text-sm mb-4">Ou se preferir, comece sem uma imagem base</p>
          <button 
            onClick={onStartFromScratch}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 border border-slate-700"
          >
            Iniciar Projeto do Zero
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
