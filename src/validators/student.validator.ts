import { body, param } from "express-validator";
import { checkCohortExists } from "./helper/cohort.validator.helper";
import { checkProjectExists } from "./helper/project.validator.helper";
import {
  checkMatricNoExists,
  checkNusnetIdExists,
  checkStudentIdExists,
} from "./helper/student.validator.helper";
import { checkUserExistsWithEmail } from "./helper/user.validator.helper";
import {
  CohortQueryValidator,
  PageQueryValidator,
  LimitQueryValidator,
} from "./validator";

export const GetStudentsValidator = [
  CohortQueryValidator.optional(),
  PageQueryValidator,
  LimitQueryValidator,
];

export const CreateStudentValidator = [
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
  body("student")
    .isObject()
    .withMessage("Student object missing in request body"),
  body("student.matricNo")
    .isString()
    .withMessage("Matric Number missing in student data")
    .custom(async (value) => {
      const exists = await checkMatricNoExists(value);
      if (exists) {
        return Promise.reject("Student with matric no already exists");
      }
    }),
  body("student.nusnetId")
    .isString()
    .withMessage("NUSNET ID missing in student data")
    .custom(async (value) => {
      const exists = await checkNusnetIdExists(value);
      if (exists) {
        return Promise.reject("Student with NUSNET ID already exists");
      }
    }),
  body("student.cohortYear")
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
  body("student.projectId")
    .optional()
    .isNumeric()
    .withMessage("Project ID must be numeric")
    .custom(async (value) => {
      const exists = await checkProjectExists(value);
      if (!exists) {
        return Promise.reject(
          "Project ID provided in student data does not exist"
        );
      }
    }),
];

export const BatchCreateStudentValidator = [
  body("count").isNumeric().withMessage("Count must be a numeric value"),
  body("projects").isArray().withMessage("Projects was not input as an array"),
];

export const GetStudentByIDValidator = [
  param("studentId")
    .isNumeric()
    .withMessage("Student ID provided must be numeric")
    .toInt(),
];

export const UpdateStudentByIDValidator = [
  param("studentId")
    .isNumeric()
    .withMessage("Student ID provided must be numeric")
    .toInt()
    .custom(async (value) => {
      const exists = checkStudentIdExists(value);
      if (!exists) {
        return Promise.reject("Student with provided ID does not exist");
      }
    }),
  body("student")
    .isObject()
    .withMessage("Student data provided was not an object"),
];
