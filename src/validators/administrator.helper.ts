import { body, param } from "express-validator";
import { checkUserExistsWithEmail } from "./helper/user.validator.helper";
import { LimitQueryValidator, PageQueryValidator } from "./validator";

export const GetAdministratorsValidator = [
  PageQueryValidator,
  LimitQueryValidator,
];

export const GetAdministratorByIDValidator = [
  param("adminId")
    .isNumeric()
    .withMessage("Admin ID provided must be numeric")
    .toInt(),
];

export const CreateAdministratorValidator = [
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
  body("administrator")
    .isObject()
    .withMessage("Admin object missing in request body"),
  body("administrator.startDate")
    .isDate()
    .withMessage("Start Date in Admin object must be a valid Date"),
  body("administrator.endDate")
    .isDate()
    .withMessage("End Date in Admin object must be a valid Date"),
];

export const BatchCreateAdministratorValidator = [
  body("count").isNumeric().withMessage("Count must be a numeric value"),
  body("accounts").isArray().withMessage("Accounts was not input as an array"),
];
