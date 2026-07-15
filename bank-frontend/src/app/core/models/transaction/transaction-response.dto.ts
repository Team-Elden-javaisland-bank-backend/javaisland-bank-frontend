export interface TransactionResponseDto {
  id: number;
  amount: number;
  typeId: number;
  statusId: number;
  description: string;
  createdAt: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  sourceBalanceAfter: number;
  destBalanceAfter: number;
}
