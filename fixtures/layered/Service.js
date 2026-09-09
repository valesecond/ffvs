import { Repository } from "./Repository.js";

export class Service {
  constructor() {
    this.repo = new Repository();
  }

  load(id) {
    return this.repo.get(id);
  }
}
