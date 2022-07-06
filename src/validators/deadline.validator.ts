import { DeadlineType } from "@prisma/client";
import { body, param } from "express-validator";
import {
  CheckBodyObjectExistsValidator,
  CohortQueryValidator,
} from "./validator";

export const GetDeadlinesValidator = [
  CohortQueryValidator,
  param("name").isString().optional(),
];

export const CreateDeadlineValidator = [
  CheckBodyObjectExistsValidator("deadline"),
  body("deadline.cohortYear")
    .isNumeric()
    .withMessage("Cohort Year in Deadline object must be numeric"),
  body("deadline.desc").isString().optional(),
  body("deadline.name")
    .isString()
    .withMessage("Deadline name in Deadline object must be present"),
  body("deadline.dueBy")
    .isISO8601()
    .withMessage("Deadline due date must be present and in IS8601 format"),
  body("deadline.type").isIn(Object.values(DeadlineType)),
];
