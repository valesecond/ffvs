export class UserRepository {
  findById(id) {
    return { id, name: "demo" };
  }

  save(user) {
    return user;
  }
}
