export class User {
  id: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  token: string;
}

export class User2 {
  // tslint:disable-next-line:variable-name
  access_token: string;
  // tslint:disable-next-line:variable-name
  token_type: string;
  // tslint:disable-next-line:variable-name
  expires_in: number;
  user: User;
}