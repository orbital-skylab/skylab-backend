import { Router, Request, Response } from "express";
import {
  addAdviserToAccount,
  createManyAdvisers,
  createNewAdviser,
} from "src/helpers/advisers.helper";
import {
  addFacilitatorToAccount,
  createManyFacilitators,
  createNewFacilitator,
} from "src/helpers/facilitator.helper";
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
import { getUserByEmail } from "src/helpers/users.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.post("/create-student/batch", async (req: Request, res: Response) => {
  try {
    const createdStudents = await createManyStudents(req.body);
    return apiResponseWrapper(res, { students: createdStudents });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-student", async (req: Request, res: Response) => {
  try {
    const createdStudent = await createNewStudent(req.body);
    return apiResponseWrapper(res, createdStudent);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/student", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdStudentData = await addStudentToAccount(userId, req.body);
    return apiResponseWrapper(res, createdStudentData);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-mentor/batch", async (req: Request, res: Response) => {
  try {
    const createdMentors = await createManyMentors(req.body);
    return apiResponseWrapper(res, createdMentors);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-mentor", async (req: Request, res: Response) => {
  try {
    const createdMentor = await createNewMentor(req.body);
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
    const createdAdvisers = await createManyAdvisers(req.body);
    return apiResponseWrapper(res, createdAdvisers);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/create-adviser", async (req: Request, res: Response) => {
  try {
    const createdAdviser = await createNewAdviser(req.body);
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
  "/create-facilitator/batch",
  async (req: Request, res: Response) => {
    try {
      const createdFacilitators = await createManyFacilitators(req.body);
      return apiResponseWrapper(res, createdFacilitators);
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);

router.post("/create-facilitator", async (req: Request, res: Response) => {
  try {
    const createdFacilitator = await createNewFacilitator(req.body);
    return apiResponseWrapper(res, createdFacilitator);
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.post("/:userId/facilitator", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const createdFacilitatorData = await addFacilitatorToAccount(
      userId,
      req.body
    );
    return apiResponseWrapper(res, createdFacilitatorData);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:email", async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const user = await getUserByEmail(email);
    console.log(user);
    return apiResponseWrapper(res, { user: user });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
