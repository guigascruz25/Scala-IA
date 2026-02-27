
import React, { useState } from 'react';
import { GeneratedImage } from '../types.ts';
import { GeminiService } from '../services/geminiService.ts';

interface GalleryViewProps {
  images: GeneratedImage[];
  onDownload: (url: string, id: string) => void;
  onImageUpdate: (id: string, newUrl: string) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ images, onDownload, onImageUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Agrupamento por carrossel
  const groups = images.reduce((acc, img) => {
    const key = img.carouselInfo?.groupId || 'single';
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {} as Record<string, GeneratedImage[]>);

  const handleQuickEdit = async (id: string, base64: string) => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    try {
      const newUrl = await GeminiService.quickEdit(base64, editPrompt);
      if (newUrl) {
        onImageUpdate(id, newUrl);
        setEditingId(null);
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

      {(Object.entries(groups) as [string, GeneratedImage[]][]).map(([groupId, groupImages]) => (
        <div key={groupId} className="space-y-8">
          {groupId !== 'single' && (
            <div className="flex items-center gap-4">
              <span className="bg-purple-600/20 text-purple-400 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-purple-500/20">Carrossel Estratégico</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {groupImages.map((img) => (
              <div key={img.id} className="group relative glass-effect rounded-3xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all duration-500 flex flex-col">
                <div className={`overflow-hidden bg-slate-950 relative flex items-center justify-center aspect-square`}>
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {img.carouselInfo && (
                    <div className="absolute top-4 left-4 z-20 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-lg border border-white/10 shadow-xl">
                      CARD {img.carouselInfo.index}/{img.carouselInfo.total}
                    </div>
                  )}

                  <button onClick={() => setEditingId(img.id)} className="absolute top-4 right-4 bg-purple-600 p-3 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-20">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.143-7.714L1 12l6.857-2.143L11 3z" />
                    </svg>
                  </button>

                  <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg border border-white/10 uppercase tracking-tighter">
                      {img.label}
                    </span>
                  </div>
                </div>

                {editingId === img.id && (
                  <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col justify-center gap-4 animate-in fade-in duration-300 z-30">
                    <h4 className="font-bold text-purple-400">Refinar com IA</h4>
                    <textarea autoFocus placeholder="Descreva o ajuste..." className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm h-32 text-white outline-none" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
                    <div className="flex gap-2">
                      <button disabled={isEditing} onClick={() => handleQuickEdit(img.id, img.url)} className="flex-1 bg-purple-600 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50">
                        {isEditing ? 'Ajustando...' : 'Aplicar'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-300">Cancelar</button>
                    </div>
                  </div>
                )}
                
                <div className="p-6 space-y-4 mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-1 rounded">{img.dimensions ? `${img.dimensions.w}x${img.dimensions.h}` : img.aspectRatio}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => onDownload(img.url, img.id)} className="bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-xs font-bold transition-all text-white">Download</button>
                    <button onClick={() => navigator.clipboard.writeText(img.prompt)} className="bg-purple-600 hover:bg-purple-700 py-3 rounded-xl text-xs font-bold transition-all text-white">Prompt</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GalleryView;
