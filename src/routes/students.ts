import { Router, Request, Response } from "express";
import { check } from "express-validator";
import {
  getFilteredStudents,
  getStudentById,
} from "src/helpers/students.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get(
  "/",
  [
    check("cohortYear").optional().isNumeric().toInt(),
    check("page").optional().isNumeric().toInt(),
    check("limit").optional().isNumeric().toInt(),
  ],
  async (req: Request, res: Response) => {
    try {
      const students = await getFilteredStudents(req.query);
      return apiResponseWrapper(res, { students: students });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/:studentId",
  [check("studentId").isNumeric()],
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
      const student = await getStudentById(Number(studentId));
      return apiResponseWrapper(res, { student: student });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
