import { Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import { getOneProjectById } from "../helpers/projects.helper";
import {
  createRelation,
  createRelationsByGroup,
  deleteEvaluationRelationByID,
  deleteEvaluationRelationsOfAdviser,
  deleteEvaluationRelationsOfProject,
  editOneEvaluationRelationByRelationID,
  getManyRelationsWithAdviserID,
  getManyRelationsWithFilter,
} from "../helpers/relations.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import authorizeAdviserOfGroup from "../middleware/authorizeAdviserOfGroup";
import authorizeAdviserOfProject from "../middleware/authorizeAdviserOfProject";
import authorizeAdviserOfRelation from "../middleware/authorizeAdviserOfRelation";
import authorizeAdviserOfTwoProjects from "../middleware/authorizeAdviserOfTwoProjects";
import authorizeSignedIn from "../middleware/authorizeSignedIn";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import {
  CreateRelationValidator,
  DeleteRelationByRelationIDValidator,
  DeleteRelationsWithAdviserIDValidator,
  DeleteRelationsWithProjectIDValidator,
  GetRelationsValidator,
  GetRelationsWithAdviserIDValidator,
  UpdateRelationByRelationIDValidator,
} from "../validators/relation.validator";
import { errorFormatter, throwValidationError } from "../validators/validator";

const router = Router();

router
  .post(
    "/",
    authorizeAdviserOfTwoProjects,
    CreateRelationValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const createdRelation = await createRelation(req.body);
        return apiResponseWrapper(res, { relation: createdRelation });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .get(
    "/",
    authorizeSignedIn,
    GetRelationsValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const relations = await getManyRelationsWithFilter(req.query);
        return apiResponseWrapper(res, {
          fromProject: req.query.from
            ? await getOneProjectById(Number(req.query.from))
            : undefined,
          toProject: req.query.to
            ? await getOneProjectById(Number(req.query.to))
            : undefined,
          relations: relations,
        });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

router.post(
  "/group",
  authorizeAdviserOfGroup,
  async (req: Request, res: Response) => {
    try {
      const createRelationsRequest = await createRelationsByGroup(req.body);
      return apiResponseWrapper(res, {
        message: `${createRelationsRequest.count} was created successfully`,
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router
  .get(
    "/adviser/:adviserId",
    authorizeSignedIn,
    GetRelationsWithAdviserIDValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { adviserId } = req.params;
      try {
        const relations = await getManyRelationsWithAdviserID(
          Number(adviserId)
        );
        return apiResponseWrapper(res, { relations: relations });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .delete(
    "/adviser/:adviserId",
    authorizeAdmin,
    DeleteRelationsWithAdviserIDValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { adviserId } = req.params;
      try {
        const deletedRelations = await deleteEvaluationRelationsOfAdviser(
          Number(adviserId)
        );
        return apiResponseWrapper(res, { relations: deletedRelations });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

router.delete(
  "/project/:projectId",
  authorizeAdviserOfProject,
  DeleteRelationsWithProjectIDValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    const { projectId } = req.params;
    try {
      const deletedRelations = await deleteEvaluationRelationsOfProject(
        Number(projectId)
      );
      return apiResponseWrapper(res, { relations: deletedRelations });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router
  .delete(
    "/:relationId",
    authorizeAdviserOfRelation,
    DeleteRelationByRelationIDValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { relationId } = req.params;
      try {
        const deletedRelation = await deleteEvaluationRelationByID(
          Number(relationId)
        );
        return apiResponseWrapper(res, { relation: deletedRelation });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:relationId",
    UpdateRelationByRelationIDValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { relationId } = req.params;
      try {
        const updatedRelation = await editOneEvaluationRelationByRelationID(
          Number(relationId),
          req.body
        );
        return apiResponseWrapper(res, { relation: updatedRelation });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

export default router;
