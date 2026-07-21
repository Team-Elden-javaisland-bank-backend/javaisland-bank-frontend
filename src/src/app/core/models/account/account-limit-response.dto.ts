export interface AccountLimitResponseDto {
  id: number;
  limitType: string;
  maxAmount: number;
  updatedAt: string;
  changePolicy: 'USER_FULL' | 'USER_LOWER_ONLY' | 'BANK_ONLY';
}
