
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, EditConfig, AspectRatio } from '../types.ts';
import { GeminiService } from '../services/geminiService.ts';

interface ImageEditorProps {
  image: GeneratedImage;
  onClose: () => void;
  onUpdate: (newUrl: string) => void;
}

type EditMode = 'none' | 'character' | 'text' | 'color' | 'remove' | 'glow';

const ImageEditor: React.FC<ImageEditorProps> = ({ image, onClose, onUpdate }) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(image.url);
  const [history, setHistory] = useState<string[]>([image.url]);
  const [editMode, setEditMode] = useState<EditMode>('none');

  // Advanced Edit States
  const [newCharacterImage, setNewCharacterImage] = useState<string | null>(null);
  const [targetText, setTargetText] = useState('');
  const [targetColor, setTargetColor] = useState('#ffffff');
  const [glowIntensity, setGlowIntensity] = useState(50);
  
  // Canvas / Mask States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const characterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editMode === 'remove' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [editMode]);

  const handleEdit = async (customInstruction?: string) => {
    let finalInstruction = customInstruction || instruction;
    
    if (editMode === 'character' && !newCharacterImage) {
      alert("Por favor, suba uma imagem do novo personagem.");
      return;
    }

    if (!finalInstruction.trim()) {
      if (editMode === 'character') finalInstruction = "Substitua a pessoa na imagem pelo novo personagem fornecido.";
      else if (editMode === 'text') finalInstruction = `Atualize o texto da imagem para: "${targetText}"`;
      else if (editMode === 'color') finalInstruction = `Altere o tema de cores da imagem para tons de ${targetColor}`;
      else if (editMode === 'remove') finalInstruction = "Remova os elementos marcados na máscara.";
      else if (editMode === 'glow') finalInstruction = `Ajuste a intensidade do brilho neon para ${glowIntensity}%`;
      else return;
    }

    setIsProcessing(true);
    try {
      let maskImage: string | undefined;
      if (editMode === 'remove' && canvasRef.current) {
        maskImage = canvasRef.current.toDataURL('image/png');
      }

      const config: EditConfig = {
        instruction: finalInstruction,
        image: currentImageUrl,
        aspectRatio: image.aspectRatio,
        newCharacterImage: newCharacterImage || undefined,
        targetText: targetText || undefined,
        targetColor: targetColor || undefined,
        maskImage: maskImage,
        glowIntensity: editMode === 'glow' ? glowIntensity : undefined
      };

      const newUrl = await GeminiService.editImage(config);
      if (newUrl) {
        setCurrentImageUrl(newUrl);
        setHistory(prev => [...prev, newUrl]);
        setInstruction('');
        setEditMode('none');
        setNewCharacterImage(null);
        setTargetText('');
        setHasMask(false);
        onUpdate(newUrl);
      } else {
        alert("A IA não conseguiu processar a edição. Tente um comando diferente.");
      }
    } catch (error: any) {
      console.error("Erro na edição:", error);
      alert(`Erro na edição: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (editMode !== 'remove') return;
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || editMode !== 'remove') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'white';

    ctx.lineTo(x * scaleX, y * scaleY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x * scaleX, y * scaleY);
    setHasMask(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      canvasRef.current.getContext('2d')?.beginPath();
    }
  };

  const clearMask = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasMask(false);
      }
    }
  };

  const handleCharacterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewCharacterImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const prevUrl = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentImageUrl(prevUrl);
      onUpdate(prevUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Preview Area */}
        <div className="flex-1 bg-black/40 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-6 left-6 z-10 flex gap-2">
            <button 
              onClick={undo} 
              disabled={history.length <= 1 || isProcessing}
              className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-lg disabled:opacity-30 transition-all"
              title="Desfazer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            {editMode === 'remove' && (
              <button 
                onClick={clearMask}
                className="bg-red-600/80 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Limpar Pincel
              </button>
            )}
          </div>

          <div className="relative w-full h-full flex items-center justify-center">
            {isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-2xl">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                <p className="text-white font-bold animate-pulse">Aplicando Inteligência...</p>
              </div>
            )}
            
            <div className="relative max-w-full max-h-full">
              <img 
                src={currentImageUrl} 
                className={`max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-500 ${isProcessing ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}
                alt="Preview"
              />
              
              {editMode === 'remove' && (
                <canvas
                  ref={canvasRef}
                  width={1024}
                  height={1024}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="absolute inset-0 w-full h-full cursor-crosshair opacity-50 mix-blend-screen"
                />
              )}
            </div>
          </div>
          
          {editMode === 'remove' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-purple-600 px-6 py-2 rounded-full text-white font-bold text-sm shadow-xl">
              Pinte na tela o que deseja remover
            </div>
          )}
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-[400px] border-l border-slate-800 p-8 flex flex-col gap-6 overflow-y-auto bg-slate-900/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white tracking-tight">Editor IA</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'character', label: 'Trocar Personagem', icon: '👤' },
              { id: 'text', label: 'Editar Texto', icon: '📝' },
              { id: 'color', label: 'Alterar Cores', icon: '🎨' },
              { id: 'remove', label: 'Remover Elementos', icon: '🧹' },
              { id: 'glow', label: 'Adicionar Glow', icon: '✨' }
            ].map(action => (
              <button 
                key={action.id}
                onClick={() => setEditMode(prev => prev === action.id ? 'none' : action.id as EditMode)}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${editMode === action.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-[10px] font-bold text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Controls based on EditMode */}
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {editMode === 'character' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Novo Personagem</label>
                <div 
                  onClick={() => characterInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${newCharacterImage ? 'border-purple-500 bg-purple-900/10' : 'border-slate-800 bg-slate-950'}`}
                >
                  {newCharacterImage ? (
                    <img src={newCharacterImage} className="h-24 w-24 object-cover rounded-xl" />
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-slate-500 font-bold">Subir Foto</span>
                    </>
                  )}
                </div>
                <input type="file" ref={characterInputRef} className="hidden" accept="image/*" onChange={handleCharacterUpload} />
              </div>
            )}

            {editMode === 'text' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Novo Texto</label>
                <input 
                  type="text"
                  value={targetText}
                  onChange={(e) => setTargetText(e.target.value)}
                  placeholder="Digite o novo texto..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-purple-500"
                />
              </div>
            )}

            {editMode === 'color' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Paleta de Cores</label>
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <input 
                    type="color"
                    value={targetColor}
                    onChange={(e) => setTargetColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                  />
                  <span className="text-sm font-mono text-slate-400 uppercase">{targetColor}</span>
                </div>
              </div>
            )}

            {editMode === 'glow' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Intensidade do Glow</label>
                  <span className="text-xs font-bold text-white">{glowIntensity}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={glowIntensity}
                  onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instrução Adicional (Opcional)</label>
              <textarea 
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Ex: Deixe o fundo mais desfocado..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-purple-500 transition-all resize-none placeholder:text-slate-700"
              />
            </div>

            <button 
              onClick={() => handleEdit()}
              disabled={isProcessing || (editMode === 'none' && !instruction.trim()) || (editMode === 'remove' && !hasMask)}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3"
            >
              {isProcessing ? "PROCESSANDO..." : "APLICAR ALTERAÇÕES"}
              {!isProcessing && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
            >
              Finalizar Edição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
