import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import {
  addAdministratorToAccount,
  createManyAdministrators,
  createNewAdministrator,
} from "src/helpers/administrators.helper";
import {
  addAdviserRoleToUser,
  createManyUsersWithAdviserRole,
  createUserWithAdviserRole,
} from "src/helpers/advisers.helper";
import {
  addMentorRoleToUser,
  createManyUsersWithMentorRole,
  createUserWithMentorRole,
} from "src/helpers/mentors.helper";

import {
  deleteOneUserById,
  editOneUserById,
  getManyUsersWithFilter,
  getOneUserByEmail,
} from "src/helpers/users.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  DeleteUserByIDValidator,
  GetUserByEmailValidator,
  GetUsersValidator,
  UpdateUserByIDValidator,
  UserRolesEnum,
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

router.post("/create-:role/batch", async (req: Request, res: Response) => {
  const { role } = req.params;
  try {
    let created;
    switch (role) {
      case UserRolesEnum.Mentor:
        created = await createManyUsersWithMentorRole(req.body);
        break;
      case UserRolesEnum.Adviser:
        created = await createManyUsersWithAdviserRole(req.body);
        break;
      case UserRolesEnum.Administrator:
        created = await createManyAdministrators(req.body);
      default:
        throw new SkylabError(
          "Invalid role to access endpoint",
          HttpStatusCode.BAD_REQUEST
        );
    }

    return apiResponseWrapper(res, { [role]: created });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-:role", async (req: Request, res: Response) => {
  const { role } = req.params;
  try {
    let created;
    switch (role) {
      case UserRolesEnum.Mentor:
        created = await createUserWithMentorRole(req.body);
        break;
      case UserRolesEnum.Adviser:
        created = await createUserWithAdviserRole(req.body);
        break;
      case UserRolesEnum.Administrator:
        created = await createNewAdministrator(req.body);
        break;
      default:
        throw new SkylabError(
          "Invalid role to access endpoint",
          HttpStatusCode.BAD_REQUEST
        );
    }
    return apiResponseWrapper(res, { [role]: created });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/:role", async (req: Request, res: Response) => {
  const { userId, role } = req.params;

  try {
    let created;
    switch (role) {
      case UserRolesEnum.Mentor:
        created = await addMentorRoleToUser(userId, req.body);
        break;
      case UserRolesEnum.Adviser:
        created = await addAdviserRoleToUser(userId, req.body);
        break;
      case UserRolesEnum.Administrator:
        created = await addAdministratorToAccount(userId, req.body);
        break;
      default:
        throw new SkylabError(
          "Invalid role to access endpoint",
          HttpStatusCode.BAD_REQUEST
        );
    }

    return apiResponseWrapper(res, created);
  } catch (e) {
    routeErrorHandler(res, e);
  }
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
    "/:email",
    GetUserByEmailValidator,
    async (req: Request, res: Response) => {
      const { email } = req.params;
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const user = await getOneUserByEmail(email);
        return apiResponseWrapper(res, { user: user });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

export default router;
