import { Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "./HTTP_Status_Codes";

export const apiResponseWrapper = (
  res: Response,
  body: object,
  error?: SkylabError
) => {
  return res
    .status(error ? error.statusCode : HttpStatusCode.OK)
    .json(error ? { message: error.message, meta: error.meta } : body);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const routeErrorHandler = (res: Response, e: any) => {
  if (!(e instanceof SkylabError)) {
    return apiResponseWrapper(
      res,
      { message: e.message || e, meta: e.meta || e },
      new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR)
    );
  }

  return apiResponseWrapper(
    res,
    { message: e.message || e, meta: e.meta || e },
    e
  );
};

export const bodyWrapper = (key: string, body: Record<string, unknown>) => {
  return { [`${key}`]: body };
};
