import { DeadlineType } from "@prisma/client";
import { body, param } from "express-validator";
import { getOneDeadlineById } from "src/helpers/deadline.helper";
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
  body("deadline.evaluatingDeadlineId")
    .if(body("deadline.type").equals("Evaluation"))
    .notEmpty()
    .isNumeric()
    .custom(async (value) => {
      try {
        const exists = await getOneDeadlineById(Number(value));
        if (!exists || exists.type != "Milestone") {
          return Promise.reject("There is no such milestone to evaluate");
        }
      } catch (e) {
        return Promise.reject("There is no such milestone to evaluate");
      }
    }),
];
