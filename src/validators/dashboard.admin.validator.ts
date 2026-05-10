import { query } from "express-validator";
import { SubmissionStatusEnum } from "../helpers/dashboard.admin.helper";
import { CohortQueryValidator } from "./validator";

export const GetSubmissionsByDeadlineIDValidator = [
  CohortQueryValidator,
  query("deadlineId").isNumeric().toInt().optional(),
  query("includeAnonymous").isBoolean().optional(),
  query("submissionStatus")
    .isIn([
      SubmissionStatusEnum.SUBMITTED,
      SubmissionStatusEnum.SUBMITTED_LATE,
      SubmissionStatusEnum.UNSUBMITTED,
    ])
    .optional(),
  query("page").isNumeric().toInt().optional(),
  query("limit").isNumeric().toInt().optional(),
  query("dropped").isBoolean(),
];
