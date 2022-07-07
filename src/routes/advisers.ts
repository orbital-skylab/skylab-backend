import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import {
  createManyUsersWithAdviserRole,
  createUserWithAdviserRole,
  deleteOneAdviserByAdviserId,
  editAdviserDataByAdviserID,
  getManyAdvisersWithFilter,
  getOneAdviserById,
} from "src/helpers/advisers.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  BatchCreateAdviserValidator,
  CreateAdviserValidator,
  GetAdviserByIDValidator,
  GetAdvisersValidator,
} from "src/validators/adviser.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router
  .get("/", GetAdvisersValidator, async (req: Request, res: Response) => {
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
  })
  .post("/", CreateAdviserValidator, async (req: Request, res: Response) => {
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
  })
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
    BatchCreateAdviserValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const createdAdvisers = await createManyUsersWithAdviserRole(req.body);
        return apiResponseWrapper(res, { advisers: createdAdvisers });
      } catch (e) {
        console.log(e);
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
  .put("/:adviserId", async (req: Request, res: Response) => {
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
  .delete(":/adviserId", async (req: Request, res: Response) => {
    const { adviserId } = req.params;
    try {
      const deletedAdviser = await deleteOneAdviserByAdviserId(
        Number(adviserId)
      );
      return apiResponseWrapper(res, { adviser: deletedAdviser });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
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
