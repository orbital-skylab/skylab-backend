import { body, param, query } from "express-validator";
import { checkAdviserIdExists } from "./helper/adviser.validator.helper";
import { checkProjectExists } from "./helper/project.validator.helper";
import { CheckBodyObjectExistsValidator } from "./validator";

export const CreateRelationValidator = [
  body("relation")
    .isObject()
    .withMessage("Relation data must be passed in request body"),
  body("relation.fromProjectId")
    .isNumeric()
    .withMessage("ID of From Project must be passed in request body")
    .custom(async (value) => {
      const exists = await checkProjectExists(value);
      if (!exists) {
        return Promise.reject("No such project exists");
      }
    }),
  body("relation.toProjectId")
    .isNumeric()
    .withMessage("ID of To Project must be passed in request body")
    .custom(async (value) => {
      const exists = await checkProjectExists(value);
      if (!exists) {
        return Promise.reject("No such project exists");
      }
    }),
];

export const GetRelationsValidator = [
  query("from").isNumeric().optional(),
  query("to").isNumeric().optional(),
];

export const GetRelationsWithAdviserIDValidator = [
  param("adviserId")
    .isNumeric()
    .custom(async (value) => {
      const exists = await checkAdviserIdExists(Number(value));
      if (!exists) {
        return Promise.reject("No such adviser exists");
      }
    }),
];

export const DeleteRelationsWithAdviserIDValidaotr = [
  param("adviserId")
    .isNumeric()
    .custom(async (value) => {
      const exists = await checkAdviserIdExists(Number(value));
      if (!exists) {
        return Promise.reject("No such adviser exists");
      }
    }),
];

export const DeleteRelationsWithProjectIDValidator = [
  param("projectId")
    .isNumeric()
    .custom(async (value) => {
      const exists = await checkProjectExists(Number(value));
      if (!exists) {
        return Promise.reject("No such adviser exists");
      }
    }),
];
