
import React from 'react';

interface HeaderProps {
  onLogoClick?: () => void;
  onDisconnectKey?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, onDisconnectKey }) => {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-slate-700/50 py-4 px-6 mb-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          aria-label="Voltar para o início"
        >
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-xl italic">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Criativos<span className="text-purple-500"> Infinitos</span></h1>
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
    </header>
  );
};

export default Header;
