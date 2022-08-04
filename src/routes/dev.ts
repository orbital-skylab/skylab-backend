import { Router, Request, Response } from "express";
import {
  addAdministratorRoleToUser,
  createManyUsersWithAdministratorRole,
  createUserWithAdministratorRole,
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
  addStudentRoleToUser,
  createManyUsersWithStudentRole,
  createUserWithStudentRole,
} from "src/helpers/students.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.post("/create-student/batch", async (req: Request, res: Response) => {
  try {
    const createStudentErrors = await createManyUsersWithStudentRole(
      req.body,
      true
    );
    return apiResponseWrapper(res, { message: createStudentErrors });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-student", async (req: Request, res: Response) => {
  try {
    const createdStudent = await createUserWithStudentRole(req.body, true);
    return apiResponseWrapper(res, createdStudent);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/student", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdStudentData = await addStudentRoleToUser(userId, req.body);
    return apiResponseWrapper(res, createdStudentData);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-mentor/batch", async (req: Request, res: Response) => {
  try {
    const createMentorErrors = await createManyUsersWithMentorRole(
      req.body,
      true
    );
    return apiResponseWrapper(res, { message: createMentorErrors });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-mentor", async (req: Request, res: Response) => {
  try {
    const createdMentor = await createUserWithMentorRole(req.body, true);
    return apiResponseWrapper(res, createdMentor);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/mentor", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdMentorData = await addMentorRoleToUser(userId, req.body);
    return apiResponseWrapper(res, createdMentorData);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-adviser/batch", async (req: Request, res: Response) => {
  try {
    const createAdviserErrors = await createManyUsersWithAdviserRole(
      req.body,
      true
    );
    return apiResponseWrapper(res, { message: createAdviserErrors });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-adviser", async (req: Request, res: Response) => {
  try {
    const createdAdviser = await createUserWithAdviserRole(req.body, true);
    return apiResponseWrapper(res, createdAdviser);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/adviser", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdAdviserData = await addAdviserRoleToUser(
      Number(userId),
      req.body
    );
    return apiResponseWrapper(res, createdAdviserData);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post(
  "/create-administrator/batch",
  async (req: Request, res: Response) => {
    try {
      const createAdministratorErrors =
        await createManyUsersWithAdministratorRole(req.body, true);
      return apiResponseWrapper(res, { message: createAdministratorErrors });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);

router.post("/create-administrator", async (req: Request, res: Response) => {
  try {
    const createdAdministrator = await createUserWithAdministratorRole(
      req.body,
      true
    );
    return apiResponseWrapper(res, createdAdministrator);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/administrator", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdAdministratorData = await addAdministratorRoleToUser(
      userId,
      req.body
    );
    return apiResponseWrapper(res, createdAdministratorData);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
