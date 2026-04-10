
export enum EvolutionType {
  FROM_SCRATCH = 'FROM_SCRATCH',
  REPLICATE = 'REPLICATE',
  BATCH = 'BATCH'
}

export interface BatchItem {
  headline: string;
  subHeadline: string;
  description: string;
  artDirection: string;
  highlight?: string;
}

export enum PhotoGenerationMode {
  FROM_SCRATCH = 'FROM_SCRATCH',
  COMBINE = 'COMBINE',
  REFERENCE = 'REFERENCE'
}

export interface PhotoGenerationConfig {
  mode: PhotoGenerationMode;
  context: string;
  complementaryPrompt?: string;
  artisticStyle: string;
  corporateStyle?: string;
  genreTheme?: string;
  moodTone?: string;
  images: string[];
  count: number;
  formats: RequestedFormat[];
  size: "1K" | "2K" | "4K";
}

export interface CreativeAnalysis {
  visualStyle: string;
  creativeType: string;
  implicitAudience: string;
  emotions: string;
  visualStructure: string;
  keyElements: {
    person?: string;
    object?: string;
    text?: string;
    background?: string;
    dominantColors?: string;
    faceMetrics?: {
      eyeDistance: string;
      noseToEyeRatio: string;
      faceShape: string;
      eyeSize: string;
      mouthWidth: string;
      chinShape: string;
      foreheadHeight: string;
      detailedFeatures: string;
    };
    pose: {
      headOrientation: 'front' | 'side-left' | 'side-right' | 'tilted';
      bodyOrientation: string;
      gazeDirection: string;
    };
  };
  basePrompt: string;
}

export interface AdCopy {
  headline: string;
  subHeadline: string;
  highlight?: string;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "4:5";

export interface RequestedFormat {
  id: string;
  ratio: AspectRatio;
  label: string;
  width?: number;
  height?: number;
  isCustom: boolean;
}

export enum DesignStrategy {
  KEEP = 'KEEP',
  EVOLVE = 'EVOLVE',
  NEW = 'NEW'
}

export interface GenerationConfig {
  evolutionType: EvolutionType;
  designStrategy?: DesignStrategy;
  modifications?: {
    person?: string;
    scenario?: string;
    colors?: string;
    emotion?: string;
    style?: string;
  };
  copies: AdCopy[];
  batchData?: BatchItem[];
  complementaryPrompt?: string;
  count: number;
  formats: RequestedFormat[];
  size: "1K" | "2K" | "4K";
  artisticStyle?: string;
  corporateStyle?: string;
  genreTheme?: string;
  moodTone?: string;
  assetImages: string[];
  elementImages: string[];
  logoImage?: string;
}

export interface EditConfig {
  instruction: string;
  image: string; // base64
  aspectRatio: AspectRatio;
  newCharacterImage?: string; // base64
  targetText?: string;
  targetColor?: string;
  maskImage?: string; // base64 for inpainting/removal
  glowIntensity?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
  dimensions?: { w: number; h: number };
  label: string;
}
