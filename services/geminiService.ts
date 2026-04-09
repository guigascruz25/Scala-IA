
import { GoogleGenAI } from "@google/genai";
import { CreativeAnalysis, GenerationConfig, EvolutionType, GeneratedImage, AspectRatio, PhotoGenerationConfig, PhotoGenerationMode, RequestedFormat, DesignStrategy, EditConfig } from "../types.ts";

export class GeminiService {
  private static modelSwitchCallback: ((message: string) => void) | null = null;

  private static styleContexts: Record<string, string> = {
    'Realistic': 'High-fidelity, sharp focus, natural lighting, realistic textures, 8k resolution.',
    'Cinematic': 'Dramatic lighting, anamorphic lens flares, shallow depth of field, color graded, epic scale.',
    'Anime': 'Japanese animation style, vibrant colors, clean lines, expressive characters, cel-shaded.',
    'Architecture': 'Clean lines, geometric precision, wide-angle lens, professional architectural photography.',
    'Cartoon': 'Playful, exaggerated features, bold colors, 2D vector style, friendly atmosphere.',
    '3D Render': 'Octane render, Ray tracing, Unreal Engine 5 style, high detail, volumetric lighting.',
    'Vector': 'Flat design, clean paths, minimalist, scalable vector graphics style.',
    'Watercolor': 'Soft edges, bleeding colors, paper texture, artistic brush strokes.',
    'Sketch / Line Art': 'Hand-drawn, pencil or ink lines, cross-hatching, artistic draft style.',
    'Oil Painting': 'Thick impasto brushwork, rich textures, classic fine art style.',
    'Abstract': 'Non-representational, focus on form and color, emotional, conceptual.',
    'Surreal': 'Dreamlike, illogical juxtapositions, Salvador Dali style, mind-bending visuals.',
    'Fashion': 'High-end editorial, studio lighting, stylish composition, vogue aesthetic.',
    'Photography': 'Professional DSLR quality, natural composition, authentic feel.',
    'Portrait': 'Close-up, soft background blur, focus on facial details and expression.'
  };

  static setOnModelSwitch(callback: (message: string) => void) {
    this.modelSwitchCallback = callback;
  }

  private static notifyModelSwitch() {
    if (this.modelSwitchCallback) {
      this.modelSwitchCallback(
        "⚠️ Esta análise está demorando um pouco mais do que o normal devido à alta demanda. Para otimizar seu tempo e entregar o melhor resultado possível, estamos alternando automaticamente para um modelo de IA mais rápido."
      );
    }
  }

  private static getAi() {
    const key = localStorage.getItem('user_gemini_key') || process.env.API_KEY || "";
    return new GoogleGenAI({ apiKey: key });
  }

  private static async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = error?.status === 503 || error?.code === 503 || error?.message?.includes('Deadline expired') || error?.message?.includes('UNAVAILABLE');
      if (retries > 0 && isRetryable) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private static getMimeType(base64: string): string {
    const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
    return match ? match[1] : 'image/png';
  }

  private static async optimizeImageSize(base64Str: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64Str);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        let quality = 0.95;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 10MB limit in base64 is roughly 13.3MB string length. We use 13,000,000 as a safe threshold.
        while (dataUrl.length > 13000000 && quality > 0.5) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  }

  static async analyzeImage(base64Image: string): Promise<CreativeAnalysis> {
    const models = ['gemini-3.1-pro-preview', 'gemini-3-pro-preview', 'gemini-3-flash-preview'];
    let lastError: any = null;

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        if (i > 0) this.notifyModelSwitch();

        return await this.withRetry(async () => {
          const ai = this.getAi();
          const prompt = `Analise este criativo publicitário. Forneça uma resposta JSON onde TODOS os valores dos campos sejam STRINGS simples.
          Campos: visualStyle, creativeType, implicitAudience, emotions, visualStructure, keyElements { person, object, text, background, dominantColors }, basePrompt (técnico em inglês).`;

          const mimeType = this.getMimeType(base64Image);
          const response = await ai.models.generateContent({
            model: model,
            contents: { 
              parts: [
                { inlineData: { mimeType, data: base64Image.split(',')[1] } }, 
                { text: prompt }
              ] 
            },
            config: { responseMimeType: "application/json" }
          });

          return JSON.parse(response.text || '{}') as CreativeAnalysis;
        }, i === 0 ? 2 : 1); // Fewer retries for primary to fail faster and switch
      } catch (error: any) {
        lastError = error;
        console.warn(`Falha no modelo ${model}:`, error);
        // Continue to next model
      }
    }

    throw lastError || new Error("Todos os modelos de análise falharam.");
  }

  static async generateVariations(
    analysis: CreativeAnalysis, 
    config: GenerationConfig,
    baseImageBase64?: string
  ): Promise<GeneratedImage[]> {
    return this.generateSingleImages(analysis, config, baseImageBase64);
  }

  private static async generateSingleImages(analysis: CreativeAnalysis, config: GenerationConfig, baseImageBase64?: string): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];
    
    if (config.evolutionType === EvolutionType.BATCH && config.batchData) {
      for (let v = 0; v < config.count; v++) {
        for (let i = 0; i < config.batchData.length; i++) {
          const item = config.batchData[i];
          for (let f = 0; f < config.formats.length; f++) {
            const format = config.formats[f];
            const seedOffset = v * 1000 + i * 100 + f;
            
            const res = await this.renderImage(
              analysis, 
              config, 
              format, 
              item.headline, 
              item.subHeadline, 
              baseImageBase64, 
              undefined, 
              seedOffset,
              item.description,
              item.artDirection,
              item.highlight
            );
            if (res) results.push(res);
          }
        }
      }
    } else {
      for (let v = 0; v < config.count; v++) {
        for (let c = 0; c < config.copies.length; c++) {
          const copy = config.copies[c];
          for (let f = 0; f < config.formats.length; f++) {
            const format = config.formats[f];
            const seedOffset = v * 100 + c * 10 + f;
            
            const res = await this.renderImage(
              analysis, 
              config, 
              format, 
              copy.headline, 
              copy.subHeadline, 
              baseImageBase64, 
              undefined, 
              seedOffset,
              undefined,
              undefined,
              copy.highlight
            );
            if (res) results.push(res);
          }
        }
      }
    }
    return results;
  }

  private static async renderImage(
    analysis: CreativeAnalysis, 
    config: GenerationConfig, 
    format: any, 
    headline: string, 
    subHeadline: string, 
    baseImg?: string,
    specificAsset?: string,
    seedOffset?: number,
    batchDescription?: string,
    batchArtDirection?: string,
    highlight?: string
  ): Promise<GeneratedImage | null> {
    const models = ['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview', 'gemini-2.5-flash-image'];
    let lastError: any = null;

    const apiRatio = format.ratio === "4:5" ? "3:4" : format.ratio;
    
    let prompt = `Você é um designer especialista em anúncios de performance para Meta Ads.

OBJETIVO:
Gerar uma nova arte mantendo o mesmo layout visual da imagem de referência, porém substituindo completamente todos os textos pelos textos fornecidos neste prompt.

REGRA CRÍTICA (OBRIGATÓRIA):
Ignorar completamente qualquer texto existente na imagem de referência.
Nunca reutilizar textos da imagem original.
Nunca manter palavras antigas.
Sempre substituir 100% pelos textos abaixo.

TEXTOS OFICIAIS DA ARTE (USAR SOMENTE ESTES):

HEADLINE:
"${headline}"

SUBHEADLINE:
"${subHeadline}"

HIGHLIGHT OPCIONAL:
"${highlight || ''}"

Não adicionar textos extras.
Não alterar palavras.
Não resumir textos.
Não adaptar textos.
Não reutilizar textos da imagem original.

REGRAS DE LAYOUT (LOCK VISUAL):

Manter exatamente:

– proporção 4:5
– estilo visual dark premium
– grid de posicionamento
– posição do personagem
– posição da headline
– posição da subheadline
– posição do highlight
– enquadramento
– contraste
– iluminação
– tipografia moderna sem serifa
– hierarquia visual

Pode variar apenas:

– micro elementos gráficos
– textura do fundo
– expressão do personagem
– pequenos detalhes decorativos

NÃO FAZER:

não criar novo layout
não mudar estrutura
não mover textos de posição
não alterar tipografia drasticamente
não copiar textos da imagem original
não misturar textos antigos com novos

IMPORTANTE:

Esta arte faz parte de uma campanha publicitária.
Todas as variações devem parecer criadas pelo mesmo designer.
Todas devem manter identidade visual consistente.

FORMATO FINAL:

Instagram Ads
proporção ${format.ratio}
alto contraste
performance marketing SaaS premium
visual limpo
fundo escuro moderno
estética Meta Ads profissional

REFERÊNCIA VISUAL: ${analysis.visualStyle}.
CONTEXTO DA CENA: ${batchDescription || analysis.basePrompt}.
DIREÇÃO DE ARTE ADICIONAL: ${batchArtDirection || config.complementaryPrompt || ''}
VARIATION SEED: ${Date.now() + (seedOffset || 0)}`;

    const parts: any[] = [];
    
    // Always include the base image (reference) if it exists, as it contains the identity to be preserved
    if (baseImg) {
      parts.push({ inlineData: { mimeType: this.getMimeType(baseImg), data: baseImg.split(',')[1] } });
    }

    if (specificAsset) {
      parts.push({ inlineData: { mimeType: this.getMimeType(specificAsset), data: specificAsset.split(',')[1] } });
    } else if (config.assetImages.length > 0) {
      const assetIndex = (seedOffset || 0) % config.assetImages.length;
      const asset = config.assetImages[assetIndex];
      parts.push({ inlineData: { mimeType: this.getMimeType(asset), data: asset.split(',')[1] } });
    }

    if (config.logoImage) {
      parts.push({ inlineData: { mimeType: this.getMimeType(config.logoImage), data: config.logoImage.split(',')[1] } });
    }
    
    parts.push({ text: prompt });

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        if (i > 0) this.notifyModelSwitch();

        return await this.withRetry(async () => {
          const ai = this.getAi();
          const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: { 
              imageConfig: { 
                aspectRatio: apiRatio as any, 
                imageSize: i === 0 ? "4K" : "1K" 
              } 
            }
          });

          const imgPart = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
          if (imgPart?.inlineData?.data) {
            const rawUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
            const optimizedUrl = await this.optimizeImageSize(rawUrl);
            return {
              id: `img-${Date.now()}-${Math.random()}`,
              url: optimizedUrl,
              prompt,
              aspectRatio: format.ratio,
              dimensions: format.width ? { w: format.width, h: format.height } : undefined,
              label: format.label,
              timestamp: Date.now()
            };
          }
          return null;
        }, i === 0 ? 2 : 1);
      } catch (error: any) {
        lastError = error;
        console.warn(`Falha no modelo de imagem ${model}:`, error);
      }
    }

    throw lastError || new Error("Todos os modelos de imagem falharam.");
  }

  static async generatePhoto(config: PhotoGenerationConfig, format: RequestedFormat): Promise<GeneratedImage | null> {
    const models = ['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview', 'gemini-2.5-flash-image'];
    let lastError: any = null;

    const stylePrompt = GeminiService.styleContexts[config.artisticStyle] || config.artisticStyle;
    const corporatePrompt = config.corporateStyle ? `CORPORATE STYLE: ${config.corporateStyle}` : '';
    const genrePrompt = config.genreTheme ? `GENRE/THEME: ${config.genreTheme}` : '';
    const moodPrompt = config.moodTone ? `MOOD/TONE: ${config.moodTone}` : '';
    const artDirection = config.complementaryPrompt ? `ART DIRECTION INSTRUCTIONS: ${config.complementaryPrompt}` : '';

    let prompt = `PHOTO GENERATION REQUEST.
    PRIMARY STYLE: ${stylePrompt}
    ${corporatePrompt}
    ${genrePrompt}
    ${moodPrompt}
    ${artDirection}
    CONTEXT: ${config.context || 'A visually stunning scene matching the selected styles.'}
    
    MODE: ${config.mode === PhotoGenerationMode.COMBINE ? 'Combine the visual elements of the provided images into a new cohesive scene.' : config.mode === PhotoGenerationMode.REFERENCE ? 'Use the style and composition of the provided image as a reference for the new generation.' : 'Generate from scratch based on the context.'}
    
    ELEVAÇÃO DE QUALIDADE (MANDATORY):
    1. COMPOSIÇÃO E PROFUNDIDADE:
       - A pessoa deve parecer integrada ao ambiente, não recortada e colada.
       - Crie pelo menos 3 planos de profundidade distintos.
       - Elementos gráficos do fundo devem passar ATRÁS e também na frente da pessoa em regiões periféricas.
    
    2. ILUMINAÇÃO E GLOW:
       - A fonte de luz principal deve ser coerente com os elementos neon ao redor.
       - A pessoa deve receber um rim light (contorno de luz) na cor do tema.
       - Glows devem ter gradação: núcleo brilhante → halo difuso → fade.
       - Sombras devem respeitar a direção da luz ambiente.
    
    3. EFEITOS GRÁFICOS:
       - Adicione waveforms ou elementos gráficos com opacidade variável no fundo.
       - Elementos flutuantes devem ter desfoque de movimento progressivo.
       - Aplique scanlines sutis ou grão cinematográfico.
       - Use light flares intensos onde houver luzes fortes.
    
    4. ACABAMENTO FINAL:
       - Vinheta suave nas bordas.
       - Qualidade de entrega: "Senior Art Director" — nível de produção dos maiores players do mercado digital brasileiro.
    
    CRITICAL: High quality, professional lighting, perfect composition.`;

    const parts: any[] = [];
    
    if (config.images && config.images.length > 0) {
      config.images.forEach(img => {
        parts.push({ inlineData: { mimeType: this.getMimeType(img), data: img.split(',')[1] } });
      });
    }
    
    parts.push({ text: prompt });

    const apiRatio = format.ratio === "1:1" ? "1:1" : format.ratio === "16:9" ? "16:9" : format.ratio === "9:16" ? "9:16" : format.ratio === "4:5" ? "3:4" : "1:1";

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        return await this.withRetry(async () => {
          const ai = this.getAi();
          const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: { 
              imageConfig: { 
                aspectRatio: apiRatio as any, 
                imageSize: config.size 
              } 
            }
          });

          const imgPart = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
          if (imgPart?.inlineData?.data) {
            const rawUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
            const optimizedUrl = await this.optimizeImageSize(rawUrl);
            return {
              id: `photo-${Date.now()}-${Math.random()}`,
              url: optimizedUrl,
              prompt,
              aspectRatio: format.ratio,
              dimensions: format.width ? { w: format.width, h: format.height } : undefined,
              label: format.label,
              timestamp: Date.now()
            };
          }
          return null;
        }, i === 0 ? 2 : 1);
      } catch (error: any) {
        lastError = error;
        console.warn(`Falha no modelo de foto ${model}:`, error);
      }
    }

    throw lastError || new Error("Todos os modelos de foto falharam.");
  }

  static async quickEdit(base64Image: string, prompt: string): Promise<string | null> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
            { text: prompt }
          ]
        }
      });
      const imgPart = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
      if (imgPart?.inlineData?.data) {
        const rawUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
        return await this.optimizeImageSize(rawUrl);
      }
      return null;
    });
  }

  static async editImage(config: EditConfig): Promise<string | null> {
    return await this.withRetry(async () => {
      const ai = this.getAi();
      const base64Data = config.image.split(',')[1];
      
      const parts: any[] = [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
      ];

      let enhancedInstruction = `EDIT INSTRUCTION: ${config.instruction}.`;

      if (config.newCharacterImage) {
        const charBase64 = config.newCharacterImage.split(',')[1];
        parts.push({ inlineData: { data: charBase64, mimeType: 'image/jpeg' } });
        enhancedInstruction += ` Use the second image as the new character/person to replace the one in the first image. Maintain the pose and lighting of the original scene.`;
      }

      if (config.maskImage) {
        const maskBase64 = config.maskImage.split(',')[1];
        parts.push({ inlineData: { data: maskBase64, mimeType: 'image/png' } });
        enhancedInstruction += ` The third image is a mask indicating the area to remove or modify. Focus the edit on the white/marked areas.`;
      }

      if (config.targetText) {
        enhancedInstruction += ` The specific text to update or add is: "${config.targetText}". Ensure it is legible and fits the style.`;
      }

      if (config.targetColor) {
        enhancedInstruction += ` Use the color ${config.targetColor} as the primary theme or for the specific elements mentioned.`;
      }

      if (config.glowIntensity !== undefined) {
        enhancedInstruction += ` Set the glow/neon intensity to level ${config.glowIntensity} (where 0 is none and 100 is maximum).`;
      }

      enhancedInstruction += ` 
      CRITICAL: This is an EDIT task, not a new generation. 
      1. PRESERVE the identity, face, and features of any person in the image 100%.
      2. MAINTAIN the background, lighting, and overall composition exactly as it is, unless specifically asked to change it.
      3. ONLY modify the specific elements requested in the instruction.
      4. Ensure the integration of new elements is seamless and matches the original style.
      5. DO NOT add any new elements or text that were not requested.
      6. If a character is being replaced, use the second image as the source for the new character, but keep the original pose and lighting.`;

      parts.push({ text: enhancedInstruction });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: config.aspectRatio === "4:5" ? "3:4" : config.aspectRatio as any
          }
        }
      });

      const imgPart = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
      if (imgPart?.inlineData?.data) {
        const rawUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
        return await this.optimizeImageSize(rawUrl);
      }
      return null;
    });
  }

  static async chatWithGemini(message: string, history: any[]): Promise<string> {
    const ai = this.getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction: "Você é o Criativos Infinitos. Auxilie no marketing digital." }
    });
    return response.text || "";
  }
}
