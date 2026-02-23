
import React from 'react';

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-slate-700/50 py-4 px-6 mb-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          aria-label="Voltar para o início"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-xl italic">S</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Scala<span className="text-indigo-400">.ai</span></h1>
        </button>
        {/* Navegação lateral removida conforme solicitado */}
      </div>
    </header>
  );
};

export default Header;
