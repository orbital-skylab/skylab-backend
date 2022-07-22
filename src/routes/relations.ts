import { Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import { getOneProjectById } from "src/helpers/projects.helper";
import {
  createRelation,
  deleteEvaluationRelationByID,
  deleteEvaluationRelationsOfAdviser,
  deleteEvaluationRelationsOfProject,
  editOneEvaluationRelationByRelationID,
  getManyRelationsWithAdviserID,
  getManyRelationsWithFilter,
} from "src/helpers/relations.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import {
  CreateRelationValidator,
  DeleteRelationByRelationIDValidator,
  DeleteRelationsWithAdviserIDValidator,
  DeleteRelationsWithProjectIDValidator,
  GetRelationsValidator,
  GetRelationsWithAdviserIDValidator,
  UpdateRelationByRelationIDValidator,
} from "src/validators/relation.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router
  .post("/", CreateRelationValidator, async (req: Request, res: Response) => {
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
  })
  .get("/", GetRelationsValidator, async (req: Request, res: Response) => {
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
  });

router
  .get(
    "/adviser/:adviserId",
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
