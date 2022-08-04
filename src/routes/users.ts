import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import { addAdministratorRoleToUser } from "src/helpers/administrators.helper";
import {
  addAdviserRoleToManyUsers,
  addAdviserRoleToUser,
} from "src/helpers/advisers.helper";
import { addMentorRoleToUser } from "src/helpers/mentors.helper";
import { addStudentRoleToUser } from "src/helpers/students.helper";

import {
  addRoleToUsers,
  deleteOneUserById,
  editOneUserById,
  getManyUsersWithFilter,
  getOneUserById,
} from "src/helpers/users.helper";
import { getLeanUsersWithFilter } from "src/models/users.db";
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
  GetUsersLeanValidator,
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

router.get(
  "/lean",
  GetUsersLeanValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const leanUsers = await getLeanUsersWithFilter(req.query);
      return apiResponseWrapper(res, { users: leanUsers });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post("/attach-adviser/batch", async (req: Request, res: Response) => {
  try {
    const advisers = await addAdviserRoleToManyUsers(req.body);
    return apiResponseWrapper(res, { advisers: advisers });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.put("/:variable", async (req: Request, res: Response) => {
  const { variable } = req.params;

  try {
    if (variable == "Students") {
      return apiResponseWrapper(res, {
        data: await addRoleToUsers(
          UserRolesEnum.Student,
          req.body.cohortYear,
          req.body.userIds
        ),
      });
    } else if (variable == "Mentors") {
      return apiResponseWrapper(res, {
        data: await addRoleToUsers(
          UserRolesEnum.Mentor,
          req.body.cohortYear,
          req.body.userIds
        ),
      });
    } else if (variable == "Administrators") {
      return apiResponseWrapper(res, {
        data: await addRoleToUsers(
          UserRolesEnum.Administrator,
          req.body.cohortYear,
          req.body.userIds
        ),
      });
    } else if (variable == "Advisers") {
      return apiResponseWrapper(res, {
        data: await addRoleToUsers(
          UserRolesEnum.Adviser,
          req.body.cohortYear,
          req.body.userIds
        ),
      });
    } else {
      // userId
      const updatedUser = await editOneUserById(
        Number(variable),
        req.body.user
      );
      return apiResponseWrapper(res, { user: updatedUser });
    }
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router
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
