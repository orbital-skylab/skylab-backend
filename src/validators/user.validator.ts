import { body, param, query } from "express-validator";
import { checkCohortExists } from "./helper/cohort.validator.helper";
import { checkProjectExists } from "./helper/project.validator.helper";
import {
  CheckBodyObjectExistsValidator,
  CohortQueryValidator,
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
  query("role")
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

export const GetUsersLeanValidator = [
  query("role")
    .toLowerCase()
    .isIn([
      UserRolesEnum.Administrator,
      UserRolesEnum.Adviser,
      UserRolesEnum.Mentor,
      UserRolesEnum.Student,
    ])
    .optional(),
  query("excludeRole")
    .toLowerCase()
    .isIn([
      UserRolesEnum.Administrator,
      UserRolesEnum.Adviser,
      UserRolesEnum.Mentor,
      UserRolesEnum.Student,
    ])
    .optional(),
  CohortQueryValidator,
];

export const UpdateUserByIDValidator = [
  UserIDParamValidator,
  CheckBodyObjectExistsValidator("user"),
  body("user.name").optional().isString(),
  body("user.email")
    .optional()
    .isEmail()
    .withMessage("Email must be in a valid email format"),
  body("user.profilePicUrl")
    .optional()
    .isURL()
    .withMessage("Must be a valid URL"),
  body("user.githubUrl").optional().isURL().withMessage("Must be a valid URL"),
  body("user.linkedinUrl")
    .optional()
    .isURL()
    .withMessage("Must be a valid URL"),
  body("user.personalSiteUrl")
    .optional()
    .isURL()
    .withMessage("Must be a valid URL"),
  body("user.selfIntro").optional().isString(),
];

export const DeleteUserByIDValidator = [UserIDParamValidator];

export const GetUserByIDValidator = [
  param("userId")
    .isNumeric()
    .withMessage("User ID to retrieve must be numeric"),
];

export const AddStudentRoleToUserValidator = [
  UserIDParamValidator,
  CheckBodyObjectExistsValidator("student"),
  body("student.matricNo")
    .isString()
    .withMessage(
      "Matric number must be sent with student information as a string value"
    ),
  body("student.nusnetId")
    .isString()
    .withMessage(
      "NUSNET ID must be sent with student information as a string value"
    ),
  body("student.cohortYear")
    .isNumeric()
    .withMessage(
      "Cohort year must be sent with student information as a numeric value"
    )
    .custom(async (value) => {
      const exists = await checkCohortExists(value);
      if (!exists) {
        return Promise.reject("No such cohort exists");
      }
    }),
  body("student.projectId")
    .isNumeric()
    .withMessage("Project ID sent with student information must be numeric")
    .custom(async (value) => {
      const exists = await checkProjectExists(value);
      if (!exists) {
        return Promise.reject("No such project exists");
      }
    })
    .optional(),
];

export const AddMentorRoleToUserValidator = [
  UserIDParamValidator,
  CheckBodyObjectExistsValidator("mentor"),
  body("mentor.cohortYear")
    .isNumeric()
    .withMessage(
      "Cohort year must be sent with mentor information as a numeric value"
    )
    .custom(async (value) => {
      const exists = await checkCohortExists(value);
      if (!exists) {
        return Promise.reject("No such cohort exists");
      }
    }),
  body("mentor.projectIds")
    .isArray()
    .withMessage("Project IDs of mentor must be sent as an array")
    .optional(),
];

export const AddAdviserRoleToUserValidator = [
  UserIDParamValidator,
  CheckBodyObjectExistsValidator("adviser"),
  body("adviser.matricNo")
    .isString()
    .withMessage(
      "Matric number must be sent with adviser information as a numeric value"
    )
    .optional(),
  body("adviser.cohortYear")
    .isNumeric()
    .withMessage(
      "Cohort year must be sent with adviser information as a numeric value"
    )
    .custom(async (value) => {
      const exists = await checkCohortExists(value);
      if (!exists) {
        return Promise.reject("No such cohort exists");
      }
    }),
  body("adviser.nusnetId")
    .isString()
    .withMessage(
      "NUSNET ID must be sent with adviser information as a numeric value"
    )
    .optional(),
  body("adviser.projectIds")
    .isArray()
    .withMessage("Project IDs of adviser must be sent as an array")
    .optional(),
];

export const AddAdministratorRoleToUserValidator = [
  UserIDParamValidator,
  CheckBodyObjectExistsValidator("administrator"),
  body("administrator.startDate")
    .isISO8601()
    .withMessage(
      "Start Date must be sent with admin information as an ISO8601 Date String"
    ),
  body("administrator.endDate")
    .isISO8601()
    .withMessage(
      "End Date must be sent with admin information as an ISO8601 Date String"
    ),
];
