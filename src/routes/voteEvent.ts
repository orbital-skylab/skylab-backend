import { Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import {
  addCandidate,
  addExternalVoter,
  addInternalVoter,
  addManyCandidates,
  addManyVotes,
  createVoteEvent,
  editVoteEvent,
  getAllCandidatesByVoteEvent,
  getAllExternalVotersByVoteEvent,
  getAllInternalVotersByVoteEvent,
  getAllVoteEvents,
  getAllVotesByVoteEvent,
  getOneVoteEventById,
  getResultsByVoteEvent,
  getVotesByVoteEventAndVoter,
  removeCandidate,
  removeExternalVoter,
  removeInternalVoter,
  removeVote,
  removeVoteEvent,
} from "../helpers/voteEvent.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { errorFormatter, throwValidationError } from "../validators/validator";
import {
  addCandidateValidator,
  addExternalVoterValidator,
  addInternalVoterValidator,
  addVotesValidator,
  batchAddCandidatesValidator,
  createVoteEventValidator,
  editVoteEventValidator,
} from "../validators/voteEvent.validator";

const router = Router();

router.get("/", async (_, res: Response) => {
  try {
    const voteEvents = await getAllVoteEvents();

    return apiResponseWrapper(res, { voteEvents });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.post(
  "/",
  authorizeAdmin,
  createVoteEventValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const voteEvent = await createVoteEvent(req.body);

      return apiResponseWrapper(res, { voteEvent });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

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
  editVoteEventValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
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
  addInternalVoterValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }

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
  addExternalVoterValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }

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
  addCandidateValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }

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
  batchAddCandidatesValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }

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

router.get("/:voteEventId/votes", async (req: Request, res: Response) => {
  const { voteEventId } = req.params;
  const { userId, externalVoterId } = req.query;

  try {
    const votes = await getVotesByVoteEventAndVoter(
      Number(voteEventId),
      userId ? Number(userId) : undefined,
      externalVoterId ? externalVoterId.toString() : undefined
    );

    return apiResponseWrapper(res, { votes });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get(
  "/:voteEventId/votes/all",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;

    try {
      const votes = await getAllVotesByVoteEvent(Number(voteEventId));

      return apiResponseWrapper(res, { votes });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/:voteEventId/votes",
  addVotesValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }

    const { voteEventId } = req.params;
    try {
      const votes = await addManyVotes({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { votes });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.delete(
  "/:voteEventId/votes/:voteId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteId } = req.params;
    try {
      const vote = await removeVote(Number(voteId));

      return apiResponseWrapper(res, { vote });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/:voteEventId/results",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;

    try {
      const results = await getResultsByVoteEvent(Number(voteEventId));

      return apiResponseWrapper(res, { results });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
