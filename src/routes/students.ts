import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  createManyStudents,
  createNewStudent,
  editStudent,
  getFilteredStudents,
  getStudentById,
} from "src/helpers/students.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import {
  BatchCreateStudentValidator,
  CreateStudentValidator,
  GetStudentByIDValidator,
  GetStudentsValidator,
  UpdateStudentByIDValidator,
} from "src/validators/student.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router
  .get("/", GetStudentsValidator, async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const students = await getFilteredStudents(req.query);
      return apiResponseWrapper(res, { students: students });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", CreateStudentValidator, async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const createdStudent = await createNewStudent(req.body);
      return apiResponseWrapper(res, { student: createdStudent });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  });

router
  .get(
    "/:studentId",
    GetStudentByIDValidator,
    async (req: Request, res: Response) => {
      const { studentId } = req.params;
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const student = await getStudentById(Number(studentId));
        return apiResponseWrapper(res, { student: student });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:studentId",
    UpdateStudentByIDValidator,
    async (req: Request, res: Response) => {
      const { studentId } = req.params;
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        return apiResponseWrapper(res, {
          student: await editStudent(Number(studentId), req.body),
        });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  );

router.post(
  "/batch",
  BatchCreateStudentValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const createdStudents = await createManyStudents(req.body);
      return apiResponseWrapper(res, { students: createdStudents });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);

export default router;
