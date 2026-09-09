export function leaf() {
  return 0;
}

export function mid() {
  return leaf();
}

export function root() {
  return mid();
}
