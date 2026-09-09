export class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `hello ${this.name}`;
  }
}
