import { Database } from "./Database.js";

export class Repository {
  constructor() {
    this.db = new Database();
  }

  get(id) {
    return this.db.query(id);
  }
}
