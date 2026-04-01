import { body, param } from "express-validator";
import { LimitQueryValidator, PageQueryValidator } from "./validator";

export const GetFaqConversationsValidator = [
  PageQueryValidator,
  LimitQueryValidator,
];

export const GetFaqConversationByIdValidator = [
  param("conversationId")
    .isNumeric()
    .withMessage("Conversation ID provided must be numeric")
    .toInt(),
];

export const CreateFaqConversationValidator = [
  body("content").isString().withMessage("Content must be a string").optional(),
];

export const DeleteFaqConversationByIdValidator = [
  param("conversationId")
    .isNumeric()
    .withMessage("Conversation ID provided must be numeric")
    .toInt(),
];

export const DeleteFaqConversationsByIdsValidator = [
  body("conversationIds")
    .isArray({ min: 1 })
    .withMessage("conversationIds must be a non-empty array"),

  body("conversationIds.*")
    .isNumeric()
    .withMessage("Each conversationId must be a number")
    .toInt(),
];

export const PostFaqMessageValidator = [
  param("conversationId")
    .isNumeric()
    .withMessage("Conversation ID provided must be numeric")
    .toInt()
    .optional(),

  body("content").isString().withMessage("Content must be a string"),
];
