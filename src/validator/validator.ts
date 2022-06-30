import { Response } from "express";
import { ErrorFormatter, Result, ValidationError } from "express-validator";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export const errorFormatter: ErrorFormatter = ({ location }) => {
  return `${location}`;
};

export const throwValidationError = (
  res: Response,
  result: Result<ValidationError>
) => {
  return res.status(HttpStatusCode.BAD_REQUEST).json({
    message: "Request arguments failed validation checks",
    meta: result,
  });
};
