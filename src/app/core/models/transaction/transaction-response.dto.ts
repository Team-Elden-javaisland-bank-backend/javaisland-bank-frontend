export interface TransactionResponseDto {
  id: number;
  amount: number;
  typeId: number;
  statusId: number;
  typeName: string;
  statusName: string;
  description: string;
  createdAt: string;
  scheduledDate: string | null;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  sourceUserName: string;
  destinationUserName: string;
  sourceBalanceAfter: number;
  destBalanceAfter: number;
}
