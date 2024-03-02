import { Router, Request, Response } from "express";
import {
  createInitialVoteEvent,
  editVoteEvent,
  getAllVoteEvents,
  removeVoteEvent,
} from "../helpers/voteEvent.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";

const router = Router();

router.get("/", async (_, res: Response) => {
  try {
    const voteEvents = await getAllVoteEvents();

    return apiResponseWrapper(res, { voteEvents });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.post("/", async (_, res: Response) => {
  try {
    const voteEvent = await createInitialVoteEvent();

    return apiResponseWrapper(res, { voteEvent });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.put("/:voteEventId", async (req: Request, res: Response) => {
  const { voteEventId } = req.params;
  try {
    const editedVoteEvent = await editVoteEvent({
      body: req.body,
      voteEventId: Number(voteEventId),
    });

    return apiResponseWrapper(res, { voteEvent: editedVoteEvent });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.delete("/:voteEventId", async (req: Request, res: Response) => {
  const { voteEventId } = req.params;
  try {
    const deletedVoteEvent = await removeVoteEvent(Number(voteEventId));

    return apiResponseWrapper(res, { voteEvent: deletedVoteEvent });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});
