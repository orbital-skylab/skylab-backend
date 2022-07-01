import { check } from "express-validator";
import {
  CohortQueryValidator,
  EmailParamValidator,
  LimitQueryValidator,
  PageQueryValidator,
  SearchQueryValidator,
  UserIDParamValidator,
} from "./validator";

export enum UserRolesEnum {
  Student = "student",
  Administrator = "administrator",
  Mentor = "mentor",
  Adviser = "adviser",
}

export const GetUsersValidator = [
  CohortQueryValidator,
  check("role")
    .optional()
    .toLowerCase()
    .isIn([
      UserRolesEnum.Administrator,
      UserRolesEnum.Adviser,
      UserRolesEnum.Mentor,
      UserRolesEnum.Student,
    ]),
  PageQueryValidator,
  LimitQueryValidator,
  SearchQueryValidator,
];

export const UpdateUserByIDValidator = [
  UserIDParamValidator,
  check("user").isObject(),
  check("user.name").optional().isString(),
  check("user.email")
    .optional()
    .isEmail()
    .withMessage("Email must be in a valid email format"),
  check("user.profilePicUrl")
    .optional()
    .isURL()
    .withMessage("Must be a valid URL"),
  check("user.githubUrl").optional().isURL().withMessage("Must be a valid URL"),
  check("user.linkedinUrl")
    .optional()
    .isURL()
    .withMessage("Must be a valid URL"),
  check("user.personalSiteUrl")
    .optional()
    .isURL()
    .withMessage("Must be a valid URL"),
  check("user.selfIntro").optional().isString(),
];

export const DeleteUserByIDValidator = [UserIDParamValidator];

export const GetUserByEmailValidator = [EmailParamValidator];
