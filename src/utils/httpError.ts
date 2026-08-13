// Routes normally fail fast with `return res.status(...)`, but code inside a
// prisma.$transaction() callback can't do that — it has to THROW to roll the
// transaction back. This carries the intended status code out to errorHandler.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}
