import { param } from "express-validator";
import { LimitQueryValidator, PageQueryValidator } from "./validator";

export const GetFaqConversationsValidator = [
  PageQueryValidator,
  LimitQueryValidator,
];

export const GetFaqConversationByIDValidator = [
  param("conversationId")
    .isNumeric()
    .withMessage("Conversation ID provided must be numeric")
    .toInt(),
];

export const PostFaqMessageValidator = [
  param("conversationId")
    .isNumeric()
    .withMessage("Conversation ID provided must be numeric")
    .toInt()
    .optional(),
];
