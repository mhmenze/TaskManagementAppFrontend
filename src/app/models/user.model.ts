export interface User {
  userID: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  username: string;
  password: string;
  email: string;
  createdOn: Date;
  createdBy?: string;
  updatedOn: Date;
  updatedBy?: string;
}