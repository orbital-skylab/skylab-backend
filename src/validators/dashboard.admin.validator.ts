import { query } from "express-validator";
import { CohortQueryValidator } from "./validator";

export const getSubmissionsByDeadlineIdValidator = [
  CohortQueryValidator,
  query("deadlineId").isNumeric(),
  query("page").isNumeric().toInt(),
  query("limit").isNumeric().toInt(),
];
