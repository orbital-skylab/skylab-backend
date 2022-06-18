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
    .json(error ? error.meta : body);
};
