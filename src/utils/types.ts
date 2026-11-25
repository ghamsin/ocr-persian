export type ExtractionMode = 'standard' | 'structured' | 'handwriting' | 'poetry';

export interface OcrDocumentRecord {
  id: string;
  title: string;
  categoryLabel: string;
  mode: ExtractionMode;
  imageUrl: string;
  mimeType: string;
  extractedText: string;
  confidence: number;
  notes: string;
  createdAt: string;
}
