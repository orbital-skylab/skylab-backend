import { Router, Request, Response } from "express";
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

const router = Router();

enum UserRoleRoutes {
  Student = "student",
  Administrator = "administrator",
  Mentor = "mentor",
  Adviser = "adviser",
}

router.get("/", async (req: Request, res: Response) => {
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
      case UserRoleRoutes.Student:
        created = await createManyStudents(req.body);
        break;
      case UserRoleRoutes.Mentor:
        created = await createManyMentors(req.body);
        break;
      case UserRoleRoutes.Adviser:
        created = await createManyAdvisers(req.body);
        break;
      case UserRoleRoutes.Administrator:
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
      case UserRoleRoutes.Student:
        created = await createNewStudent(req.body);
        break;
      case UserRoleRoutes.Mentor:
        created = await createNewMentor(req.body);
        break;
      case UserRoleRoutes.Adviser:
        created = await createNewAdviser(req.body);
        break;
      case UserRoleRoutes.Administrator:
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
      case UserRoleRoutes.Student:
        created = await addStudentToAccount(userId, req.body);
        break;
      case UserRoleRoutes.Mentor:
        created = await addMentorToAccount(userId, req.body);
        break;
      case UserRoleRoutes.Adviser:
        created = await addAdviserToAccount(userId, req.body);
        break;
      case UserRoleRoutes.Administrator:
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
  .put("/:userId", async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!req.body.user) {
      throw new SkylabError(
        "Parameters missing in request body",
        HttpStatusCode.NOT_FOUND
      );
    }

    try {
      const editedUser = await editUserInformation(
        Number(userId),
        req.body.user
      );
      return apiResponseWrapper(res, editedUser);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:userId", async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
      const deletedUser = await deleteUserById(Number(userId));
      return apiResponseWrapper(res, deletedUser);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

router.get("/:email", async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const user = await getUserByEmail(email);
    return apiResponseWrapper(res, { user: user });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
