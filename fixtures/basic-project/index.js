import { UserService } from "./UserService.js";

export class UserController {
  constructor() {
    this.service = new UserService();
  }

  createUser(name) {
    return this.service.create(name);
  }
}

export function boot() {
  return new UserController();
}
