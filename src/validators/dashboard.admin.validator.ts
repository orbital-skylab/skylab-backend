import { query } from "express-validator";
import { SubmissionStatusEnum } from "src/helpers/dashboard.admin.helper";
import { CohortQueryValidator } from "./validator";

export const GetSubmissionsByDeadlineIDValidator = [
  CohortQueryValidator,
  query("deadlineId").isNumeric().toInt(),
  query("submissionStatus")
    .isIn([
      SubmissionStatusEnum.SUBMITTED,
      SubmissionStatusEnum.SUBMITTED_LATE,
      SubmissionStatusEnum.UNSUBMITTED,
    ])
    .optional(),
  query("page").isNumeric().toInt().optional(),
  query("limit").isNumeric().toInt().optional(),
];
