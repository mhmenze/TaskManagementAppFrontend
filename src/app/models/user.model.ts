export interface User {
  userID: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  username: string;
  password: string;
  userRole: string;
  email: string;
  createdOn: Date;
  createdBy?: string;
  updatedOn: Date;
  updatedBy?: string;
}

export function initializeEmptyUser(): User {
  const now = new Date();
  return {
    userID: 0,
    firstName: '',
    middleName: '',
    lastName: '',
    displayName: '',
    username: '',
    password: '',
    userRole: '',
    email: '',
    createdOn: now,
    createdBy: '',
    updatedOn: now,
    updatedBy: ''
  };
}