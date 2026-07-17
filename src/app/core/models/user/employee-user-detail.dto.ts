export interface EmployeeUserDetailDto {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  profession: string;
  gender: string;
  fiscalCode: string;
  phone: string;
  residence: string;
  birthPlace: string;
  birthProvince: string;
  userStatus: string;
  userCreatedAt: string;
  accountNumber: string;
  balance: number;
  accountStatus: string;
  accountCreatedAt: string;
  closedAt: string | null;
  cards: {
    id: number;
    maskedCardNumber: string;
    fullCardNumber: string;
    cvv: string;
    holderName: string;
    expirationDate: string;
    cardType: string;
    cardStatus: string;
  }[];
}
