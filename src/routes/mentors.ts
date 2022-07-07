import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import {
  createManyUsersWithMentorRole,
  createUserWithMentorRole,
  deleteOneMentorByMentorID,
  editMentorDataByMentorID,
  getManyMentorsWithFilter,
  getOneMentorById,
} from "src/helpers/mentors.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  BatchCreateMentorValidator,
  CreateMentorValidator,
  GetMentorByIDValidator,
  GetMentorsValidator,
} from "src/validators/mentor.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router
  .get("/", GetMentorsValidator, async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const mentors = await getManyMentorsWithFilter(req.query);
      return apiResponseWrapper(res, { mentors: mentors });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", CreateMentorValidator, async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const createdMentor = await createUserWithMentorRole(req.body);
      return apiResponseWrapper(res, { mentor: createdMentor });
    } catch (e) {
      return routeErrorHandler(res, e);
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

router.post(
  "/batch",
  BatchCreateMentorValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const createdMentors = await createManyUsersWithMentorRole(req.body);
      return apiResponseWrapper(res, { mentors: createdMentors });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);

router
  .get(
    "/:mentorId",
    GetMentorByIDValidator,
    async (req: Request, res: Response) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
        return throwValidationError(res, errors);
      }
      const { mentorId } = req.params;
      try {
        const mentor = await getOneMentorById(Number(mentorId));
        return apiResponseWrapper(res, { mentor: mentor });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put("/:mentorId", async (req: Request, res: Response) => {
    const { mentorId } = req.params;
    try {
      const updatedMentor = await editMentorDataByMentorID(
        Number(mentorId),
        req.body
      );
      return apiResponseWrapper(res, { mentor: updatedMentor });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:mentorId", async (req: Request, res: Response) => {
    const { mentorId } = req.params;
    try {
      const deletedMentor = await deleteOneMentorByMentorID(Number(mentorId));
      return apiResponseWrapper(res, { mentor: deletedMentor });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/:mentorId", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

export default router;
