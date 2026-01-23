import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  createFaqConversation,
  deleteManyConversationsByConversationIds,
  deleteOneConversationByConversationId,
  ensureFaqConversationExists,
  getManyFaqConversationsWithFilter,
  getOneFaqConversationById,
  postFaqMessage,
} from "../helpers/ai.helper";
import authorizeSignedIn from "../middleware/authorizeSignedIn";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import {
  CreateFaqConversationValidator,
  DeleteFaqConversationByIdValidator,
  DeleteFaqConversationsByIdsValidator,
  GetFaqConversationByIdValidator,
  GetFaqConversationsValidator,
  PostFaqMessageValidator,
} from "../validators/ai.validator";
import { errorFormatter, throwValidationError } from "../validators/validator";
import jwt from "jsonwebtoken";

const router = Router();

router.get(
  "/faq",
  GetFaqConversationsValidator,
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const result = await getManyFaqConversationsWithFilter(req.query);
      return apiResponseWrapper(res, result);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/faq/:conversationId",
  authorizeSignedIn,
  GetFaqConversationByIdValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    const { conversationId } = req.params;
    try {
      const conversation = await getOneFaqConversationById(
        Number(conversationId)
      );
      return apiResponseWrapper(res, { faqConversation: conversation });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/faq",
  authorizeSignedIn,
  CreateFaqConversationValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    const { token } = req.cookies;
    const { content } = req.body;
    const jwtData = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "jwt_secret"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;

    const conversation = await createFaqConversation(
      {
        data: { userId: Number(jwtData.id) },
      },
      content
    );

    return apiResponseWrapper(res, { conversation });
  }
);

router.post(
  "/faq/:conversationId?/message",
  authorizeSignedIn,
  PostFaqMessageValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }

    const { conversationId } = req.params;
    const { content } = req.body;
    const { token } = req.cookies;

    const jwtData = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "jwt_secret"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;

    if (!content) {
      return res.status(400).json({ error: "Missing content" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
      const conversation = await ensureFaqConversationExists(
        Number(jwtData.id),
        conversationId ? Number(conversationId) : undefined
      );

      // META event
      res.write(
        `event: meta\ndata:${JSON.stringify({
          conversationId: conversation.id,
        })}\n\n`
      );

      const response = await postFaqMessage(
        {
          conversationId: conversation.id,
          content,
        },
        (chunk: string) => {
          const lines = chunk.split(/\r?\n/);
          for (const line of lines) {
            res.write(`event: message\ndata:${line}\n`);
          }
          res.write("\n");
        }
      );

      res.write(`event: done\ndata:${JSON.stringify(response)}\n\n`);

      setTimeout(() => res.end(), 0);
    } catch (err) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          message: "Streaming failed",
          error: err,
        })}\n\n`
      );
      res.end();
    }
  }
);

router.delete(
  "/faq/bulk",
  authorizeSignedIn,
  DeleteFaqConversationsByIdsValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    const { conversationIds } = req.body;
    try {
      const result = await deleteManyConversationsByConversationIds(
        conversationIds
      );

      return apiResponseWrapper(res, {
        deletedCount: result.count,
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.delete(
  "/faq/:conversationId",
  authorizeSignedIn,
  DeleteFaqConversationByIdValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    const { conversationId } = req.params;
    try {
      const deletedConversation = await deleteOneConversationByConversationId(
        Number(conversationId)
      );
      return apiResponseWrapper(res, { faqConversation: deletedConversation });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
