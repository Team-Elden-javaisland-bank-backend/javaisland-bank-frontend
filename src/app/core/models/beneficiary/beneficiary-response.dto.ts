export interface BeneficiaryResponseDto {
  id: number;
  nickname: string;
  destinationAccountNumber: string;
  destinationHolderName: string | null;
  createdAt: string;
}
