import { UserRepository } from "./UserRepository.js";
import { User } from "./User.js";

export class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  create(name) {
    const user = new User(name);
    return this.repository.save(user);
  }

  update(id, name) {
    const user = this.repository.findById(id);
    user.name = name;
    return this.repository.save(user);
  }

  delete(id) {
    return { deleted: id };
  }
}
