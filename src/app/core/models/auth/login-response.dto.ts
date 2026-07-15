export interface LoginResponseDto {
  token: string;
  role: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  limitsSetupComplete: boolean;
}
