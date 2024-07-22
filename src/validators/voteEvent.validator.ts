import { AchievementLevel } from "@prisma/client";
import { body } from "express-validator";
import { CheckBodyObjectExistsValidator } from "../validators/validator";

export const createVoteEventValidator = [
  CheckBodyObjectExistsValidator("voteEvent"),
  body("voteEvent.title")
    .isString()
    .exists()
    .withMessage("Vote event title missing in request body"),
  body("voteEvent.startTime")
    .isISO8601()
    .exists()
    .withMessage("Vote event start time missing in request body"),
  body("voteEvent.endTime")
    .isISO8601()
    .exists()
    .withMessage("Vote event end time missing in request body"),
];

export const editVoteEventValidator = [
  CheckBodyObjectExistsValidator("voteEvent"),
  body("voteEvent.title").optional().isString(),
  body("voteEvent.startTime").optional().isISO8601(),
  body("voteEvent.endTime").optional().isISO8601(),

  body("voteEvent.resultsFilter").optional().isObject(),
  body("voteEvent.voterManagement").optional().isObject(),
  body("voteEvent.voteConfig").optional().isObject(),
];

export const addInternalVoterValidator = [body("email").isEmail().exists()];

export const addExternalVoterValidator = [body("voterId").isString().exists()];

export const addCandidateValidator = [body("projectId").isInt().exists()];

export const batchAddCandidatesValidator = [
  body("cohort").isInt().exists(),
  body("achievement")
    .isIn([
      AchievementLevel.Vostok,
      AchievementLevel.Gemini,
      AchievementLevel.Apollo,
      AchievementLevel.Artemis,
      "All",
    ])
    .exists(),
];

export const addVotesValidator = [
  body("projectIds").isArray().exists(),
  body("projectIds.*").isInt().exists(),
];
