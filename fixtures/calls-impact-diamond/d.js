export function shared() {
  return 0;
}

export function left() {
  return shared();
}

export function right() {
  return shared();
}

export function top() {
  return left() + right();
}
