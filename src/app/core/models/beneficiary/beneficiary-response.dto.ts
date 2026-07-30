export interface BeneficiaryResponseDto {
  id: number;
  nickname: string;
  beneficiaryName?: string;
  destinationAccountNumber: string;
  createdAt: string;
  profilePictureUrl?: string;
}
