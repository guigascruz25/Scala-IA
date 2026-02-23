
import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onUpload: (base64: string) => void;
  isLoading: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, isLoading }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 glass-effect rounded-3xl border border-slate-700/50 text-center">
      <h2 className="text-2xl font-bold mb-2">Carregue seu Criativo</h2>
      <p className="text-slate-400 mb-8">Analise qualquer imagem de anúncio para gerar variações de alta conversão.</p>
      
      <div 
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed transition-all duration-300 rounded-2xl p-10 
          ${preview ? 'border-indigo-500/50' : 'border-slate-700 hover:border-indigo-500/50'}
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
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-indigo-900/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-400 font-medium animate-pulse">Analisando inteligência criativa...</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
