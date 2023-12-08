import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "../errors/SkylabError";
import {
  createManyUsersWithAdviserRole,
  createUserWithAdviserRole,
  deleteOneAdviserByAdviserId,
  editAdviserDataByAdviserID,
  getManyAdvisersWithFilter,
  getOneAdviserById,
} from "../helpers/advisers.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import {
  BatchCreateAdviserValidator,
  CreateAdviserValidator,
  GetAdviserByIDValidator,
  GetAdvisersValidator,
} from "../validators/adviser.validator";
import { errorFormatter, throwValidationError } from "../validators/validator";

const router = Router();

router
  .get(
    "/",
    authorizeAdmin,
    GetAdvisersValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const advisers = await getManyAdvisersWithFilter(req.query);
        return apiResponseWrapper(res, { advisers: advisers });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .post(
    "/",
    authorizeAdmin,
    CreateAdviserValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const createdAdviser = await createUserWithAdviserRole(req.body);
        return apiResponseWrapper(res, { adviser: createdAdviser });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  )
  .all("/", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

router
  .post(
    "/batch",
    authorizeAdmin,
    BatchCreateAdviserValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const createAdviserErrors = await createManyUsersWithAdviserRole(
          req.body,
          false
        );
        return apiResponseWrapper(res, { message: createAdviserErrors });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  )
  .all("/batch", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

router
  .get(
    "/:adviserId",
    GetAdviserByIDValidator,
    async (req: Request, res: Response) => {
      const { adviserId } = req.params;
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const adviser = await getOneAdviserById(Number(adviserId));
        return apiResponseWrapper(res, { adviser: adviser });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put("/:adviserId", authorizeAdmin, async (req: Request, res: Response) => {
    const { adviserId } = req.params;
    try {
      const updatedAdviser = await editAdviserDataByAdviserID(
        Number(adviserId),
        req.body
      );
      return apiResponseWrapper(res, { adviser: updatedAdviser });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete(
    ":/adviserId",
    authorizeAdmin,
    async (req: Request, res: Response) => {
      const { adviserId } = req.params;
      try {
        const deletedAdviser = await deleteOneAdviserByAdviserId(
          Number(adviserId)
        );
        return apiResponseWrapper(res, { adviser: deletedAdviser });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .all("/:adviserId", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

export default router;
