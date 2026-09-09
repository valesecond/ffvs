import { Service } from "./Service.js";

export class Controller {
  constructor() {
    this.service = new Service();
  }

  handle(id) {
    return this.service.load(id);
  }
}
