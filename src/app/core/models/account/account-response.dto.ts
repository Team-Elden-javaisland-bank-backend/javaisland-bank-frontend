export interface AccountResponseDto {
  accountNumber: string;
  balance: number;
  statusId: number;
  profileId: number;
  profileFirstName: string;
  profileLastName: string;
  userStatusId: number;
  initialAmount: number | null;
  createdAt: string;
  closedAt: string | null;
}
