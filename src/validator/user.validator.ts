import { check } from "express-validator";

export enum UserRolesEnum {
  Student = "student",
  Administrator = "administrator",
  Mentor = "mentor",
  Adviser = "adviser",
}

export const GetUsersValidator = [
  check("cohortYear").isNumeric().toInt(),
  check("role")
    .optional()
    .isIn([
      UserRolesEnum.Administrator,
      UserRolesEnum.Adviser,
      UserRolesEnum.Mentor,
      UserRolesEnum.Student,
    ])
    .toLowerCase(),
  check("page").optional().isNumeric().toInt(),
  check("limit").optional().isNumeric().toInt(),
  check("search").optional().isString(),
];

export const UpdateUserByIDValidator = [
  check("userId").isNumeric(),
  check("user").isObject(),
];

export const DeleteUserByIDValidator = [check("userId").isNumeric()];

export const GetUserByEmailValidator = [check("email").isEmail()];
