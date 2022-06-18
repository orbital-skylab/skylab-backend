import { Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "./HTTP_Status_Codes";

export const apiResponseWrapper = (
  res: Response,
  body: object,
  error?: SkylabError
) => {
  //   return res.status(error ? error.statusCode : HttpStatusCode.OK).json({
  //     error: error ? error.message : "",
  //     data: error ? error.meta : body,
  //   });

  return res
    .status(error ? error.statusCode : HttpStatusCode.OK)
    .json(error ? (error.meta ? error.meta : error.message) : body);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const routeErrorHandler = (res: Response, e: any) => {
  if (!(e instanceof SkylabError)) {
    return apiResponseWrapper(
      res,
      {},
      new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR)
    );
  }

  return apiResponseWrapper(res, {}, e);
};
