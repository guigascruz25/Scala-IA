
import React, { useState } from 'react';
import { GeneratedImage } from '../types.ts';
import { GeminiService } from '../services/geminiService.ts';
import ImageEditor from './ImageEditor.tsx';

interface GalleryViewProps {
  images: GeneratedImage[];
  onDownload: (url: string, id: string) => void;
  onImageUpdate: (id: string, newUrl: string) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ images, onDownload, onImageUpdate }) => {
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleQuickEdit = async (id: string, base64: string) => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    try {
      const newUrl = await GeminiService.quickEdit(base64, editPrompt);
      if (newUrl) {
        onImageUpdate(id, newUrl);
        setQuickEditId(null);
        setEditPrompt('');
      }
    } finally {
      setIsEditing(false);
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-16 space-y-16">
      <div className="flex justify-between items-end border-b border-slate-700 pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Ativos de Performance</h2>
          <p className="text-slate-400 mt-2">Variações estratégicas prontas para escala.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.map((img) => (
          <div 
            key={img.id} 
            className="group relative glass-effect rounded-3xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all duration-500 flex flex-col"
            onMouseEnter={() => setHoveredImage(img.id)}
            onMouseLeave={() => setHoveredImage(null)}
            onTouchStart={() => {
              const timer = setTimeout(() => setPreviewImage(img), 800);
              (window as any)._touchTimer = timer;
            }}
            onTouchEnd={() => clearTimeout((window as any)._touchTimer)}
          >
            <div className={`overflow-hidden bg-slate-950 relative flex items-center justify-center aspect-square cursor-pointer`} onClick={() => setPreviewImage(img)}>
              <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              
              {hoveredImage === img.id && (
                <div className="absolute inset-0 z-50 pointer-events-none animate-in fade-in duration-200">
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
                  <img src={img.url} alt="Quick Preview" className="absolute inset-4 object-contain rounded-xl shadow-2xl border border-white/20 scale-110 transition-transform duration-300" />
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2 z-20">
                <button 
                  onClick={() => setEditingImage(img)} 
                  className="bg-purple-600 p-3 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all"
                  title="Editor Completo"
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setQuickEditId(img.id)} 
                  className="bg-slate-800/80 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all"
                  title="Ajuste Rápido"
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.143-7.714L1 12l6.857-2.143L11 3z" />
                  </svg>
                </button>
              </div>

              <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg border border-white/10 uppercase tracking-tighter">
                  {img.label}
                </span>
              </div>
            </div>

            {quickEditId === img.id && (
              <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col justify-center gap-4 animate-in fade-in duration-300 z-30">
                <h4 className="font-bold text-purple-400">Refinar com IA</h4>
                <textarea autoFocus placeholder="Descreva o ajuste..." className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm h-32 text-white outline-none" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
                <div className="flex gap-2">
                  <button disabled={isEditing} onClick={() => handleQuickEdit(img.id, img.url)} className="flex-1 bg-purple-600 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50">
                    {isEditing ? 'Ajustando...' : 'Aplicar'}
                  </button>
                  <button onClick={() => setQuickEditId(null)} className="px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-300">Cancelar</button>
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-4 mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-1 rounded">{img.dimensions ? `${img.dimensions.w}x${img.dimensions.h}` : img.aspectRatio}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => onDownload(img.url, img.id)} className="bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-xs font-bold transition-all text-white">Baixar</button>
                <button onClick={() => navigator.clipboard.writeText(img.prompt)} className="bg-purple-600 hover:bg-purple-700 py-3 rounded-xl text-xs font-bold transition-all text-white">Prompt</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingImage && (
        <ImageEditor 
          image={editingImage} 
          onClose={() => setEditingImage(null)} 
          onUpdate={(newUrl) => onImageUpdate(editingImage.id, newUrl)} 
        />
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 md:-top-12 md:right-0 text-white hover:text-purple-400 transition-colors flex items-center gap-2 font-bold z-50">
              <span className="hidden md:inline">Fechar</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img src={previewImage.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500" />
              
              <div className="absolute bottom-0 md:-bottom-16 left-1/2 -translate-x-1/2 flex gap-4 w-full justify-center px-4">
                <button 
                  onClick={() => onDownload(previewImage.url, previewImage.id)} 
                  className="flex-1 md:flex-none bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-purple-500 hover:text-white transition-all shadow-xl"
                >
                  Baixar Arte
                </button>
                <button 
                  onClick={() => { setEditingImage(previewImage); setPreviewImage(null); }} 
                  className="flex-1 md:flex-none bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-500 transition-all shadow-xl"
                >
                  Editar Arte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
