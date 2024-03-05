import { Request, Response, Router } from "express";
import { getManyUsersOfVoteEvent } from "../helpers/users.helper";
import {
  addExternalVoter,
  addInternalVoter,
  createVoteEvent,
  editVoteEvent,
  editVoterManagement,
  getAllExternalVotersByVoteEvent,
  getAllVoteEvents,
  getOneVoteEventById,
  removeExternalVoter,
  removeInternalVoter,
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

router.post("/", async (req: Request, res: Response) => {
  try {
    const voteEvent = await createVoteEvent(req.body);

    return apiResponseWrapper(res, { voteEvent });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:voteEventId", async (req: Request, res: Response) => {
  const { voteEventId } = req.params;
  try {
    const voteEvent = await getOneVoteEventById(Number(voteEventId));

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

router.get(
  "/:voteEventId/voter-management/internal-voters",
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const internalVoters = await getManyUsersOfVoteEvent(Number(voteEventId));

      return apiResponseWrapper(res, { internalVoters: internalVoters });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.put(
  "/:voteEventId/voter-management/internal-voters",
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const internalVoter = await addInternalVoter({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { internalVoter });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.delete(
  "/:voteEventId/voter-management/internal-voters/:internalVoterId",
  async (req: Request, res: Response) => {
    const { voteEventId, internalVoterId } = req.params;
    try {
      const internalVoter = await removeInternalVoter(
        Number(voteEventId),
        Number(internalVoterId)
      );

      return apiResponseWrapper(res, { internalVoter });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/:voteEventId/voter-management/external-voters",
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const externalVoters = await getAllExternalVotersByVoteEvent(
        Number(voteEventId)
      );

      return apiResponseWrapper(res, { externalVoters: externalVoters });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/:voteEventId/voter-management/external-voters",
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const externalVoter = await addExternalVoter({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { externalVoter });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.delete(
  "/:voteEventId/voter-management/external-voters/:externalVoterId",
  async (req: Request, res: Response) => {
    const { voteEventId, externalVoterId } = req.params;
    try {
      const externalVoter = await removeExternalVoter(
        Number(voteEventId),
        externalVoterId
      );

      return apiResponseWrapper(res, { externalVoter });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.put(
  "/:voteEventId/voter-management",
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const editedVoterManagement = await editVoterManagement({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, {
        voterManagement: editedVoterManagement,
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
