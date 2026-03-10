
import React, { useState, useRef } from 'react';
import { EvolutionType, GenerationConfig, AdCopy, AspectRatio, RequestedFormat } from '../types.ts';
import { GeminiService } from '../services/geminiService.ts';

interface EvolutionFormProps {
  onGenerate: (config: GenerationConfig) => void;
  isGenerating: boolean;
  context: string;
}

const EvolutionForm: React.FC<EvolutionFormProps> = ({ onGenerate, isGenerating, context }) => {
  const [config, setConfig] = useState<GenerationConfig>({
    evolutionType: EvolutionType.REPLICATE,
    count: 3,
    formats: [{ id: 'std-1', ratio: '1:1', label: 'Feed (1:1)', isCustom: false }],
    size: "1K",
    copies: [{ headline: '', subHeadline: '' }],
    complementaryPrompt: '',
    assetImages: [],
    logoImage: undefined
  });
  
  const [customW, setCustomW] = useState<string>('');
  const [customH, setCustomH] = useState<string>('');
  const assetInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const updateCopy = (index: number, field: keyof AdCopy, value: string) => {
    const newCopies = [...config.copies];
    newCopies[index] = { ...newCopies[index], [field]: value };
    setConfig(prev => ({ ...prev, copies: newCopies }));
  };

  const addCopy = () => {
    setConfig(prev => ({ ...prev, copies: [...prev.copies, { headline: '', subHeadline: '' }] }));
  };

  const removeCopy = (index: number) => {
    if (config.copies.length <= 1) return;
    setConfig(prev => ({ ...prev, copies: prev.copies.filter((_, i) => i !== index) }));
  };

  const removeFormat = (id: string) => {
    if (config.formats.length <= 1) return;
    setConfig(prev => ({ ...prev, formats: prev.formats.filter(f => f.id !== id) }));
  };

  const addCustomFormat = () => {
    const w = parseInt(customW), h = parseInt(customH);
    if (!w || !h) return;
    const ratio = (w/h > 1.2) ? "16:9" : (w/h < 0.8) ? "9:16" : "1:1";
    setConfig(prev => ({ ...prev, formats: [...prev.formats, { id: `cust-${Date.now()}`, ratio: ratio as any, width: w, height: h, label: `${w}x${h}`, isCustom: true }] }));
    setCustomW(''); setCustomH('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'asset' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'asset') setConfig(prev => ({ ...prev, assetImages: [...prev.assetImages, base64] }));
        else setConfig(prev => ({ ...prev, logoImage: base64 }));
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const totalItems = config.count * config.copies.length * config.formats.length;

  return (
    <div className="w-full max-w-4xl mx-auto glass-effect p-8 rounded-3xl border border-slate-700/50 space-y-12">
      {/* 01 - Estratégia */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <span className="bg-purple-600 text-[10px] px-2 py-1 rounded">01</span> Estratégia de Geração
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[EvolutionType.FROM_SCRATCH, EvolutionType.REPLICATE, EvolutionType.REPLICATE_WITH_CHANGES].map(t => (
            <button key={t} onClick={() => setConfig(prev => ({ ...prev, evolutionType: t }))}
              className={`p-4 rounded-xl border-2 transition-all text-sm font-bold ${config.evolutionType === t ? 'border-purple-500 bg-purple-600/20 text-purple-400' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}>
              {t === EvolutionType.FROM_SCRATCH ? 'Novo Do Zero' : t === EvolutionType.REPLICATE ? 'Manter Estilo' : 'Evoluir Ideia'}
            </button>
          ))}
        </div>
      </section>

      {/* 02 - Ativos */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <span className="bg-purple-600 text-[10px] px-2 py-1 rounded">02</span> Biblioteca de Ativos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl min-h-[140px]">
              {config.assetImages.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-purple-500/30 group">
                  <img src={img} className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 bg-black/60 text-[8px] px-1 rounded text-white font-bold">#{idx+1}</div>
                  <button onClick={() => setConfig(prev => ({...prev, assetImages: prev.assetImages.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ))}
              <button onClick={() => assetInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-purple-500 hover:bg-purple-900/10 transition-all text-slate-500 hover:text-purple-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="text-[10px] font-bold">Adicionar</span>
              </button>
            </div>
            <input type="file" ref={assetInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'asset')} />
          </div>
          <div onClick={() => logoInputRef.current?.click()} className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 ${config.logoImage ? 'border-purple-500 bg-purple-900/10' : 'border-slate-700 bg-slate-900/50'}`}>
            {config.logoImage ? <img src={config.logoImage} className="h-20 object-contain" /> : <p className="text-slate-500 text-xs">Carregar Logo</p>}
          </div>
          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
        </div>
      </section>

      {/* 03 - Headlines */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <span className="bg-purple-600 text-[10px] px-2 py-1 rounded">03</span> Headlines e Variações de Copy
          </h3>
          <button onClick={addCopy} className="text-[10px] font-black uppercase text-purple-400 hover:text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg transition-all">+ Novo Teste de Copy</button>
        </div>
        <div className="space-y-4">
          {config.copies.map((copy, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 relative group">
              {config.copies.length > 1 && (
                <button onClick={() => removeCopy(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs">×</button>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Headline Impactante</label>
                <div className="relative">
                  <input 
                    type="text" value={copy.headline} onChange={e => updateCopy(idx, 'headline', e.target.value)}
                    placeholder="Ex: Do Sonho à Chave na Mão"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500/40"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legenda de Apoio</label>
                <div className="relative">
                  <input 
                    type="text" value={copy.subHeadline} onChange={e => updateCopy(idx, 'subHeadline', e.target.value)}
                    placeholder="Ex: Seu refúgio de luxo espera por você"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500/40"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 04 - Direção de Arte */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <span className="bg-purple-600 text-[10px] px-2 py-1 rounded">04</span> Instruções de Direção de Arte
        </h3>
        <textarea 
          value={config.complementaryPrompt}
          onChange={e => setConfig(prev => ({ ...prev, complementaryPrompt: e.target.value }))}
          placeholder="Ex: Iluminação cinematográfica de fim de tarde, ambiente rodeado por pinheiros, clima aspiracional e luxuoso..."
          className="w-full h-32 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-sm resize-none text-slate-300 focus:border-purple-500 outline-none transition-all placeholder:text-slate-600"
        />
      </section>

      {/* 05 - Formatos & Configs Finais */}
      <section className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Formatos (Scaling)</label>
             <div className="grid grid-cols-2 gap-2">
                {[
                  { r: "1:1", l: "Feed" },
                  { r: "4:5", l: "Portrait" },
                  { r: "9:16", l: "Story" },
                  { r: "16:9", l: "Banner" }
                ].map(f => {
                  const isSelected = config.formats.some(ff => ff.ratio === f.r && !ff.isCustom);
                  return (
                    <button key={f.r} onClick={() => {
                      if (isSelected) {
                        const formatToRemove = config.formats.find(ff => ff.ratio === f.r && !ff.isCustom);
                        if (formatToRemove) removeFormat(formatToRemove.id);
                      } else {
                        setConfig(prev => ({ ...prev, formats: [...prev.formats, { id: `std-${Date.now()}`, ratio: f.r as AspectRatio, label: `${f.l} (${f.r})`, isCustom: false }] }));
                      }
                    }} className={`px-3 py-2 border rounded-xl text-[10px] font-bold transition-all ${isSelected ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      {f.l} ({f.r})
                    </button>
                  );
                })}
             </div>
             
             <div className="pt-4 border-t border-slate-800 space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Formatos Personalizados</label>
               <div className="flex gap-2">
                 <input type="number" placeholder="Largura" value={customW} onChange={e => setCustomW(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500" />
                 <span className="text-slate-500 self-center text-xs">x</span>
                 <input type="number" placeholder="Altura" value={customH} onChange={e => setCustomH(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500" />
                 <button onClick={addCustomFormat} disabled={!customW || !customH} className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50">Adicionar</button>
               </div>
               
               {config.formats.filter(f => f.isCustom).length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-2">
                   {config.formats.filter(f => f.isCustom).map(f => (
                     <div key={f.id} className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 px-2 py-1 rounded-lg text-[10px] font-bold">
                       {f.label}
                       <button onClick={() => removeFormat(f.id)} className="hover:text-white ml-1">×</button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantas Variantes?</label>
             <input 
               type="number" min="1" max="10" 
               className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-center text-white font-bold outline-none focus:border-purple-500" 
               value={config.count} onChange={e => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
             />
             <p className="text-[10px] text-slate-500 text-center italic">Total estimado: {totalItems} arquivos</p>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolução</label>
             <div className="grid grid-cols-3 gap-2">
                {["1K", "2K", "4K"].map(sz => (
                  <button key={sz} onClick={() => setConfig(prev => ({ ...prev, size: sz as any }))} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${config.size === sz ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    {sz} - {sz === '1K' ? 'Digital' : sz === '2K' ? 'Premium' : 'Master'}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </section>

      <div className="pt-6">
        <button onClick={() => onGenerate(config)} disabled={isGenerating} className="relative w-full bg-gradient-to-r from-purple-600 to-purple-800 py-6 rounded-2xl font-black text-xl text-white hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-purple-500/20 disabled:opacity-50 overflow-hidden group">
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative z-10 flex items-center justify-center gap-4">
            {isGenerating ? "PROCESSANDO ESTRATÉGIA..." : `GERAR ${totalItems} VARIAÇÕES`}
            {!isGenerating && <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          </span>
        </button>
      </div>
    </div>
  );
};

export default EvolutionForm;
