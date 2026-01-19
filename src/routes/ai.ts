import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  createFaqConversation,
  ensureFaqConversationExists,
  getManyFaqConversationsWithFilter,
  getOneFaqConversationById,
  postFaqMessage,
} from "src/helpers/ai.helper";
import authorizeSignedIn from "src/middleware/authorizeSignedIn";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import {
  GetFaqConversationByIDValidator,
  GetFaqConversationsValidator,
  PostFaqMessageValidator,
} from "src/validators/ai.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";
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
      const faqConversations = await getManyFaqConversationsWithFilter(
        req.query
      );
      return apiResponseWrapper(res, { faqConversations: faqConversations });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/faq/:conversationId",
  authorizeSignedIn,
  GetFaqConversationByIDValidator,
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
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

router.post("/faq", authorizeSignedIn, async (req: Request, res: Response) => {
  const { token } = req.cookies;
  const jwtData = jwt.verify(
    token,
    process.env.JWT_SECRET ?? "jwt_secret"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  const conversation = await createFaqConversation({
    data: { userId: Number(jwtData.id) },
  });

  return apiResponseWrapper(res, { conversation });
});

router.post(
  "/faq/:conversationId?/message",
  authorizeSignedIn,
  PostFaqMessageValidator,
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const { token } = req.cookies;

    const jwtData = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "jwt_secret"
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

export default router;
