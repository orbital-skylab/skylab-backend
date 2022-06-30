import { body } from "express-validator";
import { checkCohortExists } from "./helper/cohort.validator.helper";
import { checkUserExistsWithEmail } from "./helper/user.validator.helper";
import {
  CohortQueryValidator,
  LimitQueryValidator,
  PageQueryValidator,
} from "./validator";

export const GetAdvisersValidator = [
  CohortQueryValidator.optional(),
  PageQueryValidator,
  LimitQueryValidator,
];

export const CreateAdviserValidator = [
  body("user").isObject().withMessage("User object missing in request body"),
  body("user.email")
    .isEmail()
    .withMessage("User email missing in request body")
    .custom(async (value) => {
      const exists = await checkUserExistsWithEmail(value);
      if (exists) {
        return Promise.reject("User with email provided already exists");
      }
    }),
  body("adviser")
    .isObject()
    .withMessage("Adviser object missing in request body"),
  body("adviser.matricNo")
    .isString()
    .withMessage("Matric Number missing in adviser data"),
  body("adviser.nusnetId")
    .isString()
    .withMessage("NUSNET ID missing in adviser data"),
  body("adviser.cohortYear")
    .isNumeric()
    .withMessage("Cohort year must be numeric")
    .toInt()
    .custom(async (value) => {
      const exists = await checkCohortExists(value);
      if (!exists) {
        return Promise.reject(
          "Cohort year provided in student data does not exist"
        );
      }
    }),
  body("adviser.projectIds")
    .isArray()
    .withMessage("Project IDs in adviser data not provided as an array")
    .optional(),
];

export const BatchCreateAdviserValidator = [
  body("count").isNumeric().withMessage("Count must be a numeric value"),
  body("accounts").isArray().withMessage("Accounts was not input as an array"),
];
