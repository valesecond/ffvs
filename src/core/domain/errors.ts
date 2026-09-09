export class FfvsError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "FfvsError";
    this.exitCode = exitCode;
  }
}

export class UsageError extends FfvsError {
  constructor(message: string) {
    super(message, 1);
    this.name = "UsageError";
  }
}

export class StateError extends FfvsError {
  constructor(message: string) {
    super(message, 1);
    this.name = "StateError";
  }
}

export class InternalError extends FfvsError {
  constructor(message: string) {
    super(message, 2);
    this.name = "InternalError";
  }
}
