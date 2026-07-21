export interface TransferRequestDto {
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  beneficiaryId: number | null;
  amount: number;
  description: string;
  isInstant: boolean;
  scheduledDate: string | null;
}
