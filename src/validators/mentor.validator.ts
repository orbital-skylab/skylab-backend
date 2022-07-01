import { body, param } from "express-validator";
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
];
