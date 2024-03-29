import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "../errors/SkylabError";
import {
  createManyUsersWithAdministratorRole,
  createUserWithAdministratorRole,
  deleteOneAdministratorByAdminId,
  getManyAdministratorsWithFilter,
  getOneAdministratorById,
  updateAdministratorDataByAdminID,
} from "../helpers/administrators.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import {
  BatchCreateAdministratorValidator,
  CreateAdministratorValidator,
  GetAdministratorByIDValidator,
  GetAdministratorsValidator,
} from "../validators/administrator.validator";
import { errorFormatter, throwValidationError } from "../validators/validator";

const router = Router();

router
  .get(
    "/",
    authorizeAdmin,
    GetAdministratorsValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const administrators = await getManyAdministratorsWithFilter(req.query);
        return apiResponseWrapper(res, { administrators: administrators });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .post(
    "/",
    authorizeAdmin,
    CreateAdministratorValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const createdAdmin = await createUserWithAdministratorRole(req.body);
        return apiResponseWrapper(res, { administrator: createdAdmin });
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

router.post(
  "/batch",
  authorizeAdmin,
  BatchCreateAdministratorValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const createAdminErrors = await createManyUsersWithAdministratorRole(
        req.body
      );
      return apiResponseWrapper(res, { message: createAdminErrors });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);

router
  .get(
    "/:adminId",
    authorizeAdmin,
    GetAdministratorByIDValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { adminId } = req.params;
      try {
        const administrator = await getOneAdministratorById(adminId);
        return apiResponseWrapper(res, { administrator: administrator });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put("/:adminId", authorizeAdmin, async (req: Request, res: Response) => {
    const { adminId } = req.params;
    try {
      const updateAdmin = await updateAdministratorDataByAdminID(
        Number(adminId),
        req.body
      );
      return apiResponseWrapper(res, { administrator: updateAdmin });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:adminId", authorizeAdmin, async (req: Request, res: Response) => {
    const { adminId } = req.params;
    try {
      const deletedAdmin = await deleteOneAdministratorByAdminId(
        Number(adminId)
      );
      return apiResponseWrapper(res, { administrator: deletedAdmin });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/:adminId", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

export default router;
