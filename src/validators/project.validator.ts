import { body, query } from "express-validator";
import {
  CohortQueryValidator,
  LimitQueryValidator,
  PageQueryValidator,
} from "./validator";

export const GetProjectsValidator = [
  PageQueryValidator,
  LimitQueryValidator,
  CohortQueryValidator.optional(),
  query("search").isString().optional(),
  query("achievement").isString().optional(),
  query("hasDropped").isBoolean().optional(),
];

export const CreateProjectValidator = [
  body("project")
    .isObject()
    .withMessage("Project data must be passed in request body"),
];
