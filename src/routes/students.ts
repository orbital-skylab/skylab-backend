import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import {
  createManyUsersWithStudentRole,
  createUserWithStudentRole,
  deleteOneStudentByStudentId,
  editStudentDataByStudentID,
  getManyStudentsWithFilter,
  getOneStudentById,
} from "src/helpers/students.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
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
      const students = await getManyStudentsWithFilter(req.query);
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
      const createdStudent = await createUserWithStudentRole(req.body);
      return apiResponseWrapper(res, { student: createdStudent });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  })
  .all("/", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

router
  .post(
    "/batch",
    BatchCreateStudentValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      try {
        const createStudentErrors = await createManyUsersWithStudentRole(
          req.body,
          false
        );
        return apiResponseWrapper(res, { message: createStudentErrors });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  )
  .all("/batch", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
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
        const student = await getOneStudentById(Number(studentId));
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
          student: await editStudentDataByStudentID(
            Number(studentId),
            req.body
          ),
        });
      } catch (e) {
        routeErrorHandler(res, e);
      }
    }
  )
  .delete("/:studentId", async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
      const deletedStudent = await deleteOneStudentByStudentId(
        Number(studentId)
      );
      return apiResponseWrapper(res, { student: deletedStudent });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/:studentId", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

export default router;
