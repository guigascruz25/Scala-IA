
import React, { useState } from 'react';

interface HeaderProps {
  onLogoClick?: () => void;
  onDisconnectKey?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, onDisconnectKey }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-700/50 py-4 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <button 
            onClick={onLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none shrink-0"
            aria-label="Voltar para o início"
          >
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <span className="text-white font-bold text-lg italic">C</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">Criativos<span className="text-purple-500"> Infinitos</span></h1>
          </button>
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-all text-sm font-medium shadow-lg shadow-purple-500/20"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Aprenda a gerar na prática
            </button>

            {onDisconnectKey && (
              <button
                onClick={onDisconnectKey}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Desconectar Chave
              </button>
            )}
          </div>
        </div>
      </header>

      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsVideoModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Aprenda a gerar na prática</h3>
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="w-full aspect-video bg-black">
              <iframe 
                src="https://player.vimeo.com/video/1172680181?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                className="w-full h-full"
                title="Aula prática de geração"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
