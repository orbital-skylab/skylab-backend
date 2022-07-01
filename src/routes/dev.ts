import { Router, Request, Response } from "express";
import {
  createNewAdministrator,
  addAdministratorToAccount,
  createManyAdministrators,
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
    const createdStudents = await createManyUsersWithStudentRole(
      req.body,
      true
    );
    return apiResponseWrapper(res, createdStudents);
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
    const createdMentors = await createManyMentors(req.body, true);
    return apiResponseWrapper(res, createdMentors);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-mentor", async (req: Request, res: Response) => {
  try {
    const createdMentor = await createNewMentor(req.body, true);
    return apiResponseWrapper(res, createdMentor);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/mentor", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdMentorData = await addMentorToAccount(userId, req.body);
    return apiResponseWrapper(res, createdMentorData);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-adviser/batch", async (req: Request, res: Response) => {
  try {
    const createdAdvisers = await createManyAdvisers(req.body, true);
    return apiResponseWrapper(res, createdAdvisers);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-adviser", async (req: Request, res: Response) => {
  try {
    const createdAdviser = await createNewAdviser(req.body, true);
    return apiResponseWrapper(res, createdAdviser);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/adviser", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdAdviserData = await addAdviserToAccount(userId, req.body);
    return apiResponseWrapper(res, createdAdviserData);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post(
  "/create-administrator/batch",
  async (req: Request, res: Response) => {
    try {
      const createdAdministrator = await createManyAdministrators(
        req.body,
        true
      );
      return apiResponseWrapper(res, createdAdministrator);
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);

router.post("/create-administrator", async (req: Request, res: Response) => {
  try {
    const createdAdministrator = await createNewAdministrator(req.body, true);
    return apiResponseWrapper(res, createdAdministrator);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/administrator", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdAdministratorData = await addAdministratorToAccount(
      userId,
      req.body
    );
    return apiResponseWrapper(res, createdAdministratorData);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
