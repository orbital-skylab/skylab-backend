import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import {
  createManyUsersWithAdministratorRole,
  createUserWithAdministratorRole,
  deleteOneAdministratorByAdminId,
  getManyAdministratorsWithFilter,
  getOneAdministratorById,
  updateAdministratorDataByAdminID,
} from "src/helpers/administrators.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  BatchCreateAdministratorValidator,
  CreateAdministratorValidator,
  GetAdministratorByIDValidator,
  GetAdministratorsValidator,
} from "src/validators/administrator.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router
  .get("/", GetAdministratorsValidator, async (req: Request, res: Response) => {
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
  })
  .post(
    "/",
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
  .put("/:adminId", async (req: Request, res: Response) => {
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
  .delete("/:adminId", async (req: Request, res: Response) => {
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
