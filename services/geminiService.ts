
import { GoogleGenAI } from "@google/genai";
import { CreativeAnalysis, GenerationConfig, EvolutionType, GeneratedImage, CreativeType, CarouselGoal, CarouselStyle, AspectRatio } from "../types.ts";

export class GeminiService {
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

  static async analyzeImage(base64Image: string): Promise<CreativeAnalysis> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      const prompt = `Analise este criativo publicitário. Forneça uma resposta JSON onde TODOS os valores dos campos sejam STRINGS simples.
      Campos: visualStyle, creativeType, implicitAudience, emotions, visualStructure, keyElements { person, object, text, background, dominantColors }, basePrompt (técnico em inglês).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { 
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } }, 
            { text: prompt }
          ] 
        },
        config: { responseMimeType: "application/json" }
      });

      return JSON.parse(response.text || '{}') as CreativeAnalysis;
    });
  }

  static async generateVariations(
    analysis: CreativeAnalysis, 
    config: GenerationConfig,
    baseImageBase64?: string
  ): Promise<GeneratedImage[]> {
    if (config.creativeType === CreativeType.SINGLE) {
      return this.generateSingleImages(analysis, config, baseImageBase64);
    } else {
      return this.generateCarouselSequence(analysis, config, baseImageBase64);
    }
  }

  private static async generateSingleImages(analysis: CreativeAnalysis, config: GenerationConfig, baseImageBase64?: string): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];
    
    // Gerar para cada cópia, para cada formato, o número de variantes solicitado
    for (let v = 0; v < config.count; v++) {
      for (let c = 0; c < config.copies.length; c++) {
        const copy = config.copies[c];
        for (let f = 0; f < config.formats.length; f++) {
          const format = config.formats[f];
          
          // O seedOffset garante que cada variante (v) seja visualmente diferente das outras
          const seedOffset = v * 100 + c * 10 + f;
          
          const res = await this.renderImage(
            analysis, 
            config, 
            format, 
            copy.headline, 
            copy.subHeadline, 
            baseImageBase64, 
            undefined, 
            undefined, 
            seedOffset
          );
          if (res) results.push(res);
        }
      }
    }
    return results;
  }

  private static async generateCarouselSequence(analysis: CreativeAnalysis, config: GenerationConfig, baseImageBase64?: string): Promise<GeneratedImage[]> {
    const ai = this.getAi();
    const carousel = config.carouselConfig!;
    const groupId = `carousel-${Date.now()}`;
    
    let cards = carousel.perCardContent || [];
    if (carousel.contentOption === 'CENTRAL_IDEA' && carousel.centralIdea) {
      const planPrompt = `Crie um roteiro de carrossel com ${carousel.cardCount} cards sobre: "${carousel.centralIdea}". 
      Objetivo: ${carousel.goal}. 
      Retorne um JSON: cards: [{headline: string, subHeadline: string}].`;
      
      const planRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: planPrompt,
        config: { responseMimeType: "application/json" }
      });
      cards = JSON.parse(planRes.text || '{"cards":[]}').cards;
    }

    const results: GeneratedImage[] = [];
    for (const format of config.formats) {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const specificAsset = config.assetImages.length > 0 ? config.assetImages[i % config.assetImages.length] : undefined;
        const res = await this.renderImage(analysis, config, format, card.headline, card.subHeadline || '', baseImageBase64, {
          index: i + 1,
          total: cards.length,
          groupId
        }, specificAsset);
        if (res) results.push(res);
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
    carouselInfo?: any,
    specificAsset?: string,
    seedOffset?: number
  ): Promise<GeneratedImage | null> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      const apiRatio = format.ratio === "4:5" ? "3:4" : format.ratio;

      let prompt = `SENIOR ART DIRECTOR & AD STRATEGIST.
      PRIMARY OBJECTIVE: Create a high-performance conversion ad image with ABSOLUTE IDENTITY FIDELITY.
      
      CRITICAL INSTRUCTION: The person/subject in the reference image MUST be 100% identical in the new composition. Maintain every facial feature, expression, and unique characteristic. DO NOT alter the person's identity.
      
      TEXT OVERLAY (Portuguese): 
      - Headline: "${headline}"
      - Sub-headline: "${subHeadline}"

      ART DIRECTION INSTRUCTIONS: "${config.complementaryPrompt || 'Maintain aesthetic harmony and modern composition.'}"

      STYLE REFERENCE: ${analysis.visualStyle}. 
      SCENE CONTEXT: ${analysis.basePrompt}.
      VARIATION SEED: ${Date.now() + (seedOffset || 0)}`;

      if (carouselInfo) {
        prompt += `\n\nCAROUSEL SPECIFIC: Card ${carouselInfo.index} of ${carouselInfo.total}. Ensure visual continuity with the rest of the sequence.`;
      }

      const parts: any[] = [];
      
      // Adicionar ativos específicos se houver
      if (specificAsset) {
        parts.push({ inlineData: { mimeType: 'image/png', data: specificAsset.split(',')[1] } });
      } else if (config.assetImages.length > 0) {
        // Se houver múltiplos ativos, pegar um baseado no seed para variar
        const assetIndex = (seedOffset || 0) % config.assetImages.length;
        parts.push({ inlineData: { mimeType: 'image/png', data: config.assetImages[assetIndex].split(',')[1] } });
      }

      if (config.logoImage) parts.push({ inlineData: { mimeType: 'image/png', data: config.logoImage.split(',')[1] } });
      
      // A imagem base (referência) é enviada apenas como contexto visual, não como alvo de edição direta
      if (baseImg && config.assetImages.length === 0) {
        parts.push({ inlineData: { mimeType: 'image/png', data: baseImg.split(',')[1] } });
      }
      
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: { 
          imageConfig: { 
            aspectRatio: apiRatio as any, 
            imageSize: "4K" // Forçar alta resolução para fidelidade máxima
          } 
        }
      });

      const imgPart = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
      if (imgPart?.inlineData?.data) {
        return {
          id: `img-${Date.now()}-${Math.random()}`,
          url: `data:image/png;base64,${imgPart.inlineData.data}`,
          prompt,
          aspectRatio: format.ratio,
          dimensions: format.width ? { w: format.width, h: format.height } : undefined,
          label: format.label,
          timestamp: Date.now(),
          carouselInfo
        };
      }
      return null;
    });
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
      return imgPart?.inlineData?.data ? `data:image/png;base64,${imgPart.inlineData.data}` : null;
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
