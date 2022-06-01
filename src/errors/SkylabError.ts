export class SkylabError extends Error {
  statusCode: number;
  meta?: unknown;

  constructor(message: string, statusCode: number, meta?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.meta = meta;
    Object.setPrototypeOf(this, SkylabError.prototype);
  }
}
