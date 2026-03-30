// figure.types.ts: TypeScript types for figures

export interface Figure {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  svgContent: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FigureCreateRequest {
  title: string;
  projectId: string;
}

export interface FigureUpdateRequest {
  title?: string;
  svgContent?: string;
  isPublic?: boolean;
  tags?: string[];
}
