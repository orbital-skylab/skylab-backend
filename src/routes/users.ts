import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import { addAdministratorRoleToUser } from "src/helpers/administrators.helper";
import { addAdviserRoleToUser } from "src/helpers/advisers.helper";
import { addMentorRoleToUser } from "src/helpers/mentors.helper";
import { addStudentRoleToUser } from "src/helpers/students.helper";

import {
  deleteOneUserById,
  editOneUserById,
  getManyUsersWithFilter,
  getOneUserById,
} from "src/helpers/users.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  AddAdministratorRoleToUserValidator,
  AddAdviserRoleToUserValidator,
  AddMentorRoleToUserValidator,
  AddStudentRoleToUserValidator,
  DeleteUserByIDValidator,
  GetUserByIDValidator,
  GetUsersValidator,
  UpdateUserByIDValidator,
} from "src/validators/user.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router.get("/", GetUsersValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return throwValidationError(res, errors);
  }
  try {
    const users = await getManyUsersWithFilter(req.query);
    return apiResponseWrapper(res, { users: users });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router
  .put(
    "/:userId/student",
    AddStudentRoleToUserValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }

      const { userId } = req.params;

      try {
        const createdStudentRole = await addStudentRoleToUser(userId, req.body);
        return apiResponseWrapper(res, { student: createdStudentRole });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:userId/mentor",
    AddMentorRoleToUserValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }

      const { userId } = req.params;
      try {
        const createdMentorRole = await addMentorRoleToUser(userId, req.body);
        return apiResponseWrapper(res, { mentor: createdMentorRole });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:userId/adviser",
    AddAdviserRoleToUserValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { userId } = req.params;
      try {
        const createdAdviserRole = await addAdviserRoleToUser(userId, req.body);
        return apiResponseWrapper(res, { adviser: createdAdviserRole });
      } catch (e) {
        console.log(e);
        routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:userId/administrator",
    AddAdministratorRoleToUserValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { userId } = req.params;
      try {
        const createAdminRole = await addAdministratorRoleToUser(
          userId,
          req.body
        );
        return apiResponseWrapper(res, { administrator: createAdminRole });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  )
  .all("/:userId/:role", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

router
  .put(
    "/:userId",
    UpdateUserByIDValidator,
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }

      try {
        const editedUser = await editOneUserById(Number(userId), req.body.user);
        return apiResponseWrapper(res, { user: editedUser });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .delete(
    "/:userId",
    DeleteUserByIDValidator,
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }

      try {
        const deletedUser = await deleteOneUserById(Number(userId));
        return apiResponseWrapper(res, { user: deletedUser });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .get(
    "/:userId",
    GetUserByIDValidator,
    async (req: Request, res: Response) => {
      const { userId } = req.params;
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const user = await getOneUserById(Number(userId));
        return apiResponseWrapper(res, { user: user });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

export default router;
