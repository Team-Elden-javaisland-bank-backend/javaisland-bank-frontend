export interface TransactionRequestDto {
  accountNumber: string;
  amount: number;
  pin?: string;
}
