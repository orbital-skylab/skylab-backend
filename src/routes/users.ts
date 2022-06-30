import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import {
  addAdministratorToAccount,
  createManyAdministrators,
  createNewAdministrator,
} from "src/helpers/administrators.helper";
import {
  addAdviserToAccount,
  createManyAdvisers,
  createNewAdviser,
} from "src/helpers/advisers.helper";
import {
  addMentorToAccount,
  createManyMentors,
  createNewMentor,
} from "src/helpers/mentors.helper";
import {
  createManyStudents,
  createNewStudent,
  addStudentToAccount,
} from "src/helpers/students.helper";
import {
  deleteUserById,
  editUserInformation,
  getFilteredUsers,
  getUserByEmail,
} from "src/helpers/users.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { UserGetFilterRoles } from "src/helpers/users.helper";
import {
  DeleteUserByIDValidator,
  GetUserByEmailValidator,
  GetUsersValidator,
  UpdateUserByIDValidator,
} from "src/validator/user.validator";
import { errorFormatter, throwValidationError } from "src/validator/validator";

const router = Router();

router.get("/", GetUsersValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return throwValidationError(res, errors);
  }
  try {
    const users = await getFilteredUsers(req.query);
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
      case UserGetFilterRoles.Student:
        created = await createManyStudents(req.body);
        break;
      case UserGetFilterRoles.Mentor:
        created = await createManyMentors(req.body);
        break;
      case UserGetFilterRoles.Adviser:
        created = await createManyAdvisers(req.body);
        break;
      case UserGetFilterRoles.Administrator:
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
      case UserGetFilterRoles.Student:
        created = await createNewStudent(req.body);
        break;
      case UserGetFilterRoles.Mentor:
        created = await createNewMentor(req.body);
        break;
      case UserGetFilterRoles.Adviser:
        created = await createNewAdviser(req.body);
        break;
      case UserGetFilterRoles.Administrator:
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
      case UserGetFilterRoles.Student:
        created = await addStudentToAccount(userId, req.body);
        break;
      case UserGetFilterRoles.Mentor:
        created = await addMentorToAccount(userId, req.body);
        break;
      case UserGetFilterRoles.Adviser:
        created = await addAdviserToAccount(userId, req.body);
        break;
      case UserGetFilterRoles.Administrator:
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
        const editedUser = await editUserInformation(
          Number(userId),
          req.body.user
        );
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
        const deletedUser = await deleteUserById(Number(userId));
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
        const user = await getUserByEmail(email);
        return apiResponseWrapper(res, { user: user });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

export default router;
