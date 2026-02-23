
export enum EvolutionType {
  FROM_SCRATCH = 'FROM_SCRATCH',
  REPLICATE = 'REPLICATE',
  REPLICATE_WITH_CHANGES = 'REPLICATE_WITH_CHANGES'
}

export enum CreativeType {
  SINGLE = 'SINGLE',
  CAROUSEL = 'CAROUSEL'
}

export enum CarouselGoal {
  EDUCATE = 'EDUCATE',
  STORYTELLING = 'STORYTELLING',
  AUTHORITY = 'AUTHORITY',
  OFFER = 'OFFER',
  DIRECT_CONVERSION = 'DIRECT_CONVERSION'
}

export enum CarouselStyle {
  CONSISTENT = 'CONSISTENT',
  ALTERNATING = 'ALTERNATING',
  EVOLUTIONARY = 'EVOLUTIONARY'
}

export interface CarouselConfig {
  cardCount: number;
  goal: CarouselGoal;
  style: CarouselStyle;
  contentOption: 'CENTRAL_IDEA' | 'PER_CARD';
  centralIdea?: string;
  perCardContent?: { headline: string; subHeadline?: string }[];
  optimizations: {
    retention: boolean;
    cta: boolean;
    balance: boolean;
    adaptation: boolean;
  };
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
  };
  basePrompt: string;
}

export interface AdCopy {
  headline: string;
  subHeadline: string;
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

export interface GenerationConfig {
  evolutionType: EvolutionType;
  creativeType: CreativeType;
  carouselConfig?: CarouselConfig;
  modifications?: {
    person?: string;
    scenario?: string;
    colors?: string;
    emotion?: string;
    style?: string;
  };
  copies: AdCopy[];
  complementaryPrompt?: string;
  count: number;
  formats: RequestedFormat[];
  size: "1K" | "2K" | "4K";
  assetImages: string[];
  logoImage?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
  dimensions?: { w: number; h: number };
  label: string;
  carouselInfo?: {
    index: number;
    total: number;
    groupId: string;
  };
}
