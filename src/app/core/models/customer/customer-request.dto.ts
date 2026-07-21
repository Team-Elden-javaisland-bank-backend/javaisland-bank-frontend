export interface CustomerRequestDto {
  id: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  processedAt: string | null;
}
