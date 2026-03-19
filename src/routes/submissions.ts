import { Request, Response, Router } from "express";
import {
  createOneSubmission,
  getAnonymousAnswersViaAdviserID,
  getAnonymousAnswersViaStudentID,
  getSubmissionBySubmissionId,
  updateOneSubmissionBySubmissionId,
} from "../helpers/submissions.helper";
import authorizeSignedIn from "../middleware/authorizeSignedIn";
import authorizeSubmitter from "../middleware/authorizeSubmitter";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { extractJwtData } from "../helpers/authentication.helper";
import { findUniqueUserWithRoleData } from "../models/users.db";
import {
  UrlValidationRules,
  verifyDriveFileAgainstRules,
} from "../helpers/drive.helper";
import { prisma } from "../client";
import { QuestionType, UrlType } from "@prisma/client";

const router = Router();

router.post("/", authorizeSignedIn, async (req: Request, res: Response) => {
  try {
    const createdSubmission = await createOneSubmission(req.body);
    return apiResponseWrapper(res, { submission: createdSubmission });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get(
  "/student/:studentId/anonymous-questions",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
      return apiResponseWrapper(res, {
        deadlines: await getAnonymousAnswersViaStudentID(Number(studentId)),
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/adviser/:adviserId/anonymous-questions",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { adviserId } = req.params;
    try {
      return apiResponseWrapper(res, {
        deadlines: await getAnonymousAnswersViaAdviserID(Number(adviserId)),
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router
  .get(
    "/:submissionId",
    authorizeSubmitter,
    async (req: Request, res: Response) => {
      const { submissionId } = req.params;
      try {
        const jwtData = extractJwtData(req, res);
        const userData = await findUniqueUserWithRoleData({
          where: { id: Number(jwtData.id) },
        });
        const submission = await getSubmissionBySubmissionId(
          Number(submissionId),
          userData
        );
        return apiResponseWrapper(res, { submission });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:submissionId",
    authorizeSubmitter,
    async (req: Request, res: Response) => {
      const { submissionId } = req.params;
      try {
        const updatedSubmission = await updateOneSubmissionBySubmissionId(
          Number(submissionId),
          req.body
        );
        return apiResponseWrapper(res, { submission: updatedSubmission });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

router.post(
  "/verify-drive-file",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    try {
      const {
        url,
        questionId,
        urlType,
        urlValidationRules,
      }: {
        url?: string;
        questionId?: number | string;
        urlType?: UrlType;
        urlValidationRules?: UrlValidationRules;
      } = req.body;

      if (!url) {
        throw new Error("url is required");
      }

      let resolvedUrlType: UrlType | null | undefined = urlType;
      let resolvedRules: UrlValidationRules | null | undefined =
        urlValidationRules;

      if (questionId != null) {
        const numericQuestionId =
          typeof questionId === "string" ? Number(questionId) : questionId;

        const question = await prisma.question.findUnique({
          where: { id: numericQuestionId },
          select: {
            id: true,
            type: true,
            urlType: true,
            urlValidationRules: true,
          },
        });

        if (!question) {
          throw new Error("Question not found");
        }

        if (question.type !== QuestionType.Url) {
          throw new Error("This question is not a URL question");
        }

        resolvedUrlType =
          (question.urlType as UrlType | null) ?? UrlType.Generic;
        resolvedRules =
          (question.urlValidationRules as UrlValidationRules | null) ?? null;
      }

      const result = await verifyDriveFileAgainstRules({
        url,
        urlType: resolvedUrlType ?? UrlType.Generic,
        urlValidationRules: resolvedRules ?? null,
      });

      return apiResponseWrapper(res, result);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
