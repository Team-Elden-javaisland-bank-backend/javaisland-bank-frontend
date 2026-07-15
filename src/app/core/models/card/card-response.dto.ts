export interface CardResponseDto {
  id: number;
  maskedCardNumber: string;
  holderName: string;
  expirationDate: string;
  cardType: string;
  status: string;
  accountId: number;
  accountNumber: string;
}
