export interface AccountResponseDto {
  accountNumber: string;
  balance: number;
  statusId: number;
  profileId: number;
  profileFirstName: string;
  profileLastName: string;
  profilePictureUrl?: string;
  userStatusId: number;
  initialAmount: number | null;
  isLimitsConfigured?: boolean;
  createdAt: string;
  closedAt: string | null;
  closureRequestedAt?: string | null;
}
