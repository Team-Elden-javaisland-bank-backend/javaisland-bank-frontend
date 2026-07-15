export interface AccountResponseDto {
  accountNumber: string;
  balance: number;
  statusId: number;
  profileId: number;
  createdAt: string;
  closedAt: string | null;
}
