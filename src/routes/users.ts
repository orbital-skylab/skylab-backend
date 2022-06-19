import { Router, Request, Response } from "express";
import {
  addStudentToAccount,
  createManyStudents,
  createNewStudent,
} from "src/helpers/users.helper";
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

export default router;
