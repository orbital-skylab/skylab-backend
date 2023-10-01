import { Response } from "express";
import {
  body,
  ErrorFormatter,
  param,
  query,
  Result,
  ValidationError,
} from "express-validator";
import { checkCohortExists } from "./helper/cohort.validator.helper";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import {
  checkUserExistsWithEmail,
  checkUserExistsWithID,
} from "./helper/user.validator.helper";

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

export const CohortQueryValidator = query("cohortYear")
  .isNumeric()
  .withMessage("Cohort year must be numeric")
  .toInt()
  .custom(async (value) => {
    const exists = await checkCohortExists(value);
    if (!exists) {
      return Promise.reject("No such cohort exists");
    }
  });

export const TargetAudienceRoleValidator = query("targetAudienceRole")
  .isIn(["Student", "Mentor", "Adviser", "All"])
  .optional();

export const PageQueryValidator = query("page")
  .isNumeric()
  .withMessage("Page number must be numeric")
  .toInt()
  .optional();

export const LimitQueryValidator = query("limit")
  .isNumeric()
  .withMessage("Limit must be numeric")
  .toInt()
  .optional();

export const SearchQueryValidator = param("search").optional().isString();

export const UserIDParamValidator = param("userId")
  .isNumeric()
  .withMessage("User ID must be numeric")
  .toInt()
  .custom(async (value) => {
    const exists = await checkUserExistsWithID(value);
    if (!exists) {
      return Promise.reject("No such user ID exists");
    }
  });

export const EmailParamValidator = param("email")
  .isEmail()
  .withMessage("Must be a valid email")
  .custom(async (value) => {
    const exists = checkUserExistsWithEmail(value);
    if (!exists) {
      return Promise.reject("No such user exists with this email");
    }
  });

export function CheckBodyObjectExistsValidator(objectName: string) {
  return body(objectName)
    .isObject()
    .withMessage(`${objectName} must be sent in request body as an object`);
}
