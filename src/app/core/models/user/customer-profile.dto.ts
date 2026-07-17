export interface CustomerProfileDto {
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
  registeredAt: string;
  totalAccounts: number;
  activeAccounts: number;
  totalCards: number;
  activeCards: number;
  accounts: {
    accountNumber: string;
    balance: number;
    status: string;
    createdAt: string;
  }[];
  cards: {
    id: number;
    maskedCardNumber: string;
    holderName: string;
    expirationDate: string;
    cardType: string;
    cardStatus: string;
  }[];
}
