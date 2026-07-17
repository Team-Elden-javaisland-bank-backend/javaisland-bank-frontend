export interface BeneficiaryRequestDto {
  nickname: string;
  destinationAccountNumber: string;
  destinationHolderName: string | null;
}
