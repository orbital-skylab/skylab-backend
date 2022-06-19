import { Router, Request, Response } from "express";
import {
  getFilteredStudents,
  getStudentById,
} from "src/helpers/students.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const students = await getFilteredStudents(req.query);
    return apiResponseWrapper(res, { students: students });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:studentId", async (req: Request, res: Response) => {
  const { studentId } = req.params;
  try {
    const student = await getStudentById(studentId);
    return apiResponseWrapper(res, { student: student });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
