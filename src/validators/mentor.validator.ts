import { body, param } from "express-validator";
import { checkCohortExists } from "./helper/cohort.validator.helper";
import { checkUserExistsWithEmail } from "./helper/user.validator.helper";
import {
  CohortQueryValidator,
  LimitQueryValidator,
  PageQueryValidator,
} from "./validator";

export const GetMentorsValidator = [
  CohortQueryValidator.optional(),
  PageQueryValidator,
  LimitQueryValidator,
];

export const GetMentorByIDValidator = [
  param("mentorId")
    .isNumeric()
    .withMessage("Mentor ID provided must be numeric")
    .toInt(),
];

export const CreateMentorValidator = [
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
  body("mentor")
    .isObject()
    .withMessage("Mentor object missing in request body"),
  body("mentor.cohortYear")
    .isNumeric()
    .withMessage("Cohort year must be numeric")
    .toInt()
    .custom(async (value) => {
      const exists = await checkCohortExists(value);
      if (!exists) {
        return Promise.reject(
          "Cohort year provided in mentor data does not exist"
        );
      }
    }),
  body("mentor.projectIds")
    .isArray()
    .withMessage("Project IDs in mentor data not provided as an array")
    .optional(),
];

export const BatchCreateMentorValidator = [
  body("count").isNumeric().withMessage("Count must be a numeric value"),
  body("mentors").isArray().withMessage("Mentors was not input as an array"),
];
