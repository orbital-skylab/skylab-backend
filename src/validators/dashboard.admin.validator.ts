import { query } from "express-validator";
import { getOneDeadlineById } from "src/helpers/deadline.helper";
import { CohortQueryValidator } from "./validator";

export const getSubmissionsByDeadlineIdValidator = [
  CohortQueryValidator,
  query("deadlineId")
    .isNumeric()
    .custom(async (value: number) => {
      try {
        const exists = await getOneDeadlineById(Number(value));
        if (!exists || exists.type != "Milestone") {
          return Promise.reject("There is no such milestone to evaluate");
        }
      } catch (e) {
        return Promise.reject("There is no such milestone to evaluate");
      }
    }),
  ,
];
