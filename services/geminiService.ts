
import { GoogleGenAI } from "@google/genai";
import { CreativeAnalysis, GenerationConfig, EvolutionType, GeneratedImage, AspectRatio, PhotoGenerationConfig, PhotoGenerationMode, RequestedFormat } from "../types.ts";

export class GeminiService {
  private static modelSwitchCallback: ((message: string) => void) | null = null;

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
              item.artDirection
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
              seedOffset
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
    batchArtDirection?: string
  ): Promise<GeneratedImage | null> {
    const models = ['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview', 'gemini-2.5-flash-image'];
    let lastError: any = null;

    const apiRatio = format.ratio === "4:5" ? "3:4" : format.ratio;
    
    const artDirection = batchArtDirection || config.complementaryPrompt || 'Maintain aesthetic harmony and modern composition.';
    const sceneContext = batchDescription || analysis.basePrompt;

    let prompt = `SENIOR ART DIRECTOR & AD STRATEGIST.
    PRIMARY OBJECTIVE: Create a high-performance conversion ad image with ABSOLUTE IDENTITY FIDELITY.
    
    CRITICAL INSTRUCTION: The person/subject in the reference image MUST be 100% identical in the new composition. Maintain every facial feature, expression, and unique characteristic. DO NOT alter the person's identity.
    
    TEXT OVERLAY (Portuguese): 
    - Headline: "${headline}"
    - Sub-headline: "${subHeadline}"

    ART DIRECTION INSTRUCTIONS: "${artDirection}"

    STYLE REFERENCE: ${analysis.visualStyle}. 
    SCENE CONTEXT: ${sceneContext}.
    VARIATION SEED: ${Date.now() + (seedOffset || 0)}`;

    const parts: any[] = [];
    
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
    
    if (baseImg && config.assetImages.length === 0) {
      parts.push({ inlineData: { mimeType: this.getMimeType(baseImg), data: baseImg.split(',')[1] } });
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

    const styleContexts: Record<string, string> = {
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

    const stylePrompt = styleContexts[config.artisticStyle] || config.artisticStyle;
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
