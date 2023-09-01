import { body } from "express-validator";
import {
  CheckBodyObjectExistsValidator,
  CohortQueryValidator,
  SearchQueryValidator,
  TargetAudienceRoleValidator,
} from "./validator";
import { TargetAudienceRole } from "@prisma/client";

export const GetAnnouncementsValidator = [
  CohortQueryValidator,
  SearchQueryValidator,
  TargetAudienceRoleValidator,
];

export const CreateAnnouncementValidator = [
  CheckBodyObjectExistsValidator("announcement"),
  body("announcement.title")
    .isString()
    .withMessage("Announcement title missing in request body"),
  body("announcement.content")
    .isString()
    .withMessage("Announcement content missing in request body"),
  body("announcement.cohortYear")
    .isNumeric()
    .withMessage("Announcement cohortYear missing in request body"),
  body("announcement.targetAudienceRole")
    .isString()
    .isIn([
      TargetAudienceRole.All,
      TargetAudienceRole.Student,
      TargetAudienceRole.Adviser,
      TargetAudienceRole.Mentor,
    ]),
  body("announcement.shouldSendEmail")
    .isBoolean()
    .withMessage("Announcement shouldSendEmail missing in request body"),
  body("announcement.authorId")
    .isNumeric()
    .withMessage("Announcement authorId missing in request body"),
];

export const CreateAnnouncementCommentValidator = [
  CheckBodyObjectExistsValidator("comment"),
  body("comment.content")
    .isString()
    .withMessage("Comment content missing in request body"),
  body("comment.authorId")
    .isNumeric()
    .withMessage("Comment authorId missing in request body"),
];
