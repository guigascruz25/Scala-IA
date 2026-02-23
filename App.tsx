
import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import ImageUpload from './components/ImageUpload.tsx';
import AnalysisView from './components/AnalysisView.tsx';
import EvolutionForm from './components/EvolutionForm.tsx';
import GalleryView from './components/GalleryView.tsx';
import ChatBot from './components/ChatBot.tsx';
import { GeminiService } from './services/geminiService.ts';
import { CreativeAnalysis, GeneratedImage, GenerationConfig } from './types.ts';

const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width; let h = img.height;
      if (w > h) { if (w > maxWidth) { h *= maxWidth / w; w = maxWidth; } }
      else { if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const App: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'analysis' | 'evolution' | 'results'>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CreativeAnalysis | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          // @ts-ignore
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } catch (e) {
          console.error("Erro ao verificar API Key:", e);
        }
      }
    };
    checkKey();
  }, []);

  const resetApp = () => {
    if (isProcessing) return;
    setStep('upload');
    setOriginalImage(null);
    setAnalysis(null);
    setGeneratedImages([]);
    setIsProcessing(false);
  };

  const onImageUpload = async (base64: string) => {
    setIsProcessing(true);
    setProcessingMessage('Iniciando análise de inteligência criativa...');
    try {
      const compressed = await compressImage(base64);
      setOriginalImage(compressed);
      const result = await GeminiService.analyzeImage(compressed);
      setAnalysis(result);
      setStep('analysis');
    } catch (e: any) { 
      // @ts-ignore
      if (e?.message?.includes('Requested entity was not found.') && window.aistudio) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      alert("Análise falhou. Verifique sua conexão ou chave de API."); 
    } finally { setIsProcessing(false); }
  };

  const onGenerate = async (config: GenerationConfig) => {
    if (!analysis) return;
    setIsProcessing(true);
    setProcessingMessage('Escalando ativos: Planejando narrativa e renderizando criativos...');
    
    // Timer para mudar as mensagens de carregamento e manter o usuário engajado
    const messages = [
      'Planejando estrutura narrativa...',
      'Renderizando ativos visuais de alta conversão...',
      'Integrando branding e elementos de design...',
      'Finalizando composição estratégica para ads...',
      'Quase pronto: Otimizando para retenção máxima...'
    ];
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setProcessingMessage(messages[msgIndex]);
    }, 4000);

    try {
      const compressedAssets = await Promise.all(config.assetImages.map(img => compressImage(img)));
      let compressedLogo = config.logoImage ? await compressImage(config.logoImage) : undefined;

      const results = await GeminiService.generateVariations(
        analysis, 
        { ...config, assetImages: compressedAssets, logoImage: compressedLogo }, 
        originalImage || undefined
      );
      
      if (results && results.length > 0) {
        setGeneratedImages(results);
        setStep('results');
      } else {
        alert("A IA não retornou imagens. Tente ajustar o prompt ou ativos.");
      }
    } catch (e: any) { 
      // @ts-ignore
      if (e?.message?.includes('Requested entity was not found.') && window.aistudio) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      alert("Erro na geração. Detalhes: " + (e.message || "Erro desconhecido")); 
    } finally { 
      clearInterval(interval);
      setIsProcessing(false); 
    }
  };

  const handleUpdateImage = (id: string, newUrl: string) => {
    setGeneratedImages(prev => prev.map(img => img.id === id ? { ...img, url: newUrl } : img));
  };

  const onDownload = (url: string, id: string) => {
    const a = document.createElement('a'); a.href = url; a.download = `scala-${id}.jpg`; a.click();
  };

  // @ts-ignore
  const isInsideAiStudio = !!window.aistudio;

  if (!hasApiKey && isInsideAiStudio) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Header onLogoClick={resetApp} />
        <div className="max-w-lg glass-effect p-10 rounded-3xl border border-slate-700/50 space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Conecte sua Inteligência</h2>
            <p className="text-slate-400 text-lg">
              Para usar a tecnologia Scala, você precisa conectar uma chave de API de um projeto Google Cloud com faturamento ativo.
            </p>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl text-left space-y-3 border border-slate-800">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Passos para o usuário:</h3>
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
              <li>Certifique-se de estar logado na conta Google desejada.</li>
              <li>O projeto deve ter a <strong>Generative Language API</strong> ativada.</li>
              <li>Modelos Pro exigem um projeto com <strong>faturamento (billing)</strong> configurado.</li>
              <li>Consulte a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 underline">documentação de faturamento</a> para mais detalhes.</li>
            </ul>
          </div>

          <button 
            onClick={async () => {
              // @ts-ignore
              if (window.aistudio) await window.aistudio.openSelectKey();
              setHasApiKey(true);
            }} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
          >
            Selecionar Chave de API
          </button>
          
          <p className="text-slate-500 text-xs">
            Sua chave é usada apenas nesta sessão e não é armazenada por nós.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-slate-950 text-slate-200">
      <Header onLogoClick={resetApp} />
      <main className="px-6 max-w-7xl mx-auto">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-10 animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-center space-y-4 max-w-lg">
              <h2 className="text-3xl font-black text-white tracking-tight">Processando Inteligência...</h2>
              <p className="text-indigo-400 font-medium text-lg animate-pulse">{processingMessage}</p>
              <div className="flex justify-center gap-1.5 pt-4">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
            </div>
            <p className="text-slate-500 text-xs italic font-medium">A IA da Scala está pensando como um estrategista de performance.</p>
          </div>
        ) : (
          <>
            {step === 'upload' && <ImageUpload onUpload={onImageUpload} isLoading={isProcessing} />}
            {step === 'analysis' && analysis && <AnalysisView analysis={analysis} onContinue={() => setStep('evolution')} />}
            {step === 'evolution' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="flex items-center gap-6 max-w-4xl mx-auto border-b border-slate-800 pb-8">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-700 shrink-0 shadow-2xl">
                    <img src={originalImage!} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Estúdio de Escala</h2>
                    <p className="text-slate-400">Gere múltiplos formatos e sequências estratégicas.</p>
                  </div>
                </div>
                <EvolutionForm onGenerate={onGenerate} isGenerating={isProcessing} context={analysis?.basePrompt || ''} />
              </div>
            )}
            {step === 'results' && (
              <div className="space-y-16 animate-in fade-in duration-700">
                <GalleryView images={generatedImages} onDownload={onDownload} onImageUpdate={handleUpdateImage} />
                <div className="flex justify-center pb-20">
                  <button onClick={() => setStep('evolution')} className="bg-slate-800 hover:bg-slate-700 px-12 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-xl">
                    Voltar ao Estúdio
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <ChatBot />
    </div>
  );
};

export default App;
