
import React from 'react';
import { CreativeAnalysis } from '../types.ts';

interface AnalysisViewProps {
  analysis: CreativeAnalysis;
  onContinue: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onContinue }) => {
  // Helper to ensure we don't try to render an object directly as a child in React
  const safeRender = (val: any): string => {
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    return String(val || '');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-effect p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Inteligência Estratégica
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Estilo Visual</p>
              <p className="text-slate-200">{safeRender(analysis.visualStyle)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tipo</p>
              <p className="text-slate-200">{safeRender(analysis.creativeType)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Público</p>
              <p className="text-slate-200">{safeRender(analysis.implicitAudience)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Emoções</p>
              <p className="text-slate-200">{safeRender(analysis.emotions)}</p>
            </div>
          </div>
        </div>

        <div className="glass-effect p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Composição Visual
          </h3>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Elementos</p>
                 <div className="flex flex-wrap gap-2 mt-1">
                    {analysis.keyElements.person && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Pessoa</span>}
                    {analysis.keyElements.object && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Produto</span>}
                    {analysis.keyElements.text && <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Copy</span>}
                 </div>
               </div>
               <div>
                 <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Cores</p>
                 <p className="text-slate-200 text-sm">{safeRender(analysis.keyElements.dominantColors)}</p>
               </div>
             </div>
             <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Estrutura</p>
                <p className="text-slate-200 text-sm">{safeRender(analysis.visualStructure)}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="glass-effect p-8 rounded-2xl border border-purple-500/20 bg-purple-900/10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Prompt Base (IA)
        </h3>
        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 font-mono text-sm text-slate-300 leading-relaxed italic">
          "{safeRender(analysis.basePrompt)}"
        </div>
        <div className="mt-8 flex justify-end">
          <button 
            onClick={onContinue}
            className="group flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-purple-600/20"
          >
            Iniciar Evolução
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
