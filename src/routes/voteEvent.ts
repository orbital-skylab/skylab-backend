import { Request, Response, Router } from "express";
import {
  addCandidate,
  addExternalVoter,
  addInternalVoter,
  addManyCandidates,
  createVoteEvent,
  editVoteEvent,
  editVoterManagement,
  getAllCandidatesByVoteEvent,
  getAllExternalVotersByVoteEvent,
  getAllInternalVotersByVoteEvent,
  getAllVoteEvents,
  getOneVoteEventById,
  removeCandidate,
  removeExternalVoter,
  removeInternalVoter,
  removeVoteEvent,
} from "../helpers/voteEvent.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import authorizeAdmin from "../middleware/authorizeAdmin";

const router = Router();

router.get("/", async (_, res: Response) => {
  try {
    const voteEvents = await getAllVoteEvents();

    return apiResponseWrapper(res, { voteEvents });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.post("/", authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const voteEvent = await createVoteEvent(req.body);

    return apiResponseWrapper(res, { voteEvent });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get(
  "/:voteEventId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const voteEvent = await getOneVoteEventById(Number(voteEventId));

      return apiResponseWrapper(res, { voteEvent });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.put(
  "/:voteEventId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
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
  }
);

router.delete(
  "/:voteEventId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const deletedVoteEvent = await removeVoteEvent(Number(voteEventId));

      return apiResponseWrapper(res, { voteEvent: deletedVoteEvent });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/:voteEventId/voter-management/internal-voters",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const internalVoters = await getAllInternalVotersByVoteEvent(
        Number(voteEventId)
      );

      return apiResponseWrapper(res, { internalVoters: internalVoters });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/:voteEventId/voter-management/internal-voters",
  authorizeAdmin,
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
  authorizeAdmin,
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
  authorizeAdmin,
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
  authorizeAdmin,
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
  authorizeAdmin,
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
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const editedVoteEvent = await editVoterManagement({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { voteEvent: editedVoteEvent });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get("/:voteEventId/candidates", async (req: Request, res: Response) => {
  const { voteEventId } = req.params;
  try {
    const candidates = await getAllCandidatesByVoteEvent(Number(voteEventId));

    return apiResponseWrapper(res, { candidates });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.post(
  "/:voteEventId/candidates",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const candidate = await addCandidate({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { candidate });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/:voteEventId/candidates/batch",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const candidates = await addManyCandidates({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { candidates });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.delete(
  "/:voteEventId/candidates/:candidateId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId, candidateId } = req.params;
    try {
      const candidate = await removeCandidate(
        Number(voteEventId),
        Number(candidateId)
      );

      return apiResponseWrapper(res, { candidate });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
