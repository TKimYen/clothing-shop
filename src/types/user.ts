export type Role = "ADMIN" | "CUSTOMER";

export type Address = {
  id: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  createdAt: string;
  addresses: Address[];
};

export type UserInput = {
  email: string;
  fullName: string;
  phone: string;
  role: Role;
};
