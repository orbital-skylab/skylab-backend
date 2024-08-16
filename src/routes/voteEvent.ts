/* eslint-disable @typescript-eslint/no-explicit-any */
import { VoteEvent } from "@prisma/client";
import { Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import authorizeVoter from "../middleware/authorizeVoter";
import authorizeVoterOfVoteEvent from "../middleware/authorizeVoterOfVoteEvent";
import {
  addCandidate,
  addExternalVoter,
  addInternalVoter,
  addManyCandidates,
  addManyExternalVoters,
  addManyInternalVoters,
  addManyVotes,
  createVoteEvent,
  editVoteEvent,
  editVoterManagement,
  generateExternalVoters,
  getAllCandidatesByVoteEvent,
  getAllExternalVotersByVoteEvent,
  getAllInternalVotersByVoteEvent,
  getAllVoteEvents,
  getAllVotesByVoteEvent,
  getExternalVoterVoteEvents,
  getInternalVoterVoteEvents,
  getOneVoteEventById,
  getResultsByVoteEvent,
  getVotesByVoteEventAndVoter,
  removeCandidate,
  removeExternalVoter,
  removeInternalVoter,
  removeVote,
  removeVoteEvent,
  VOTE_EVENT_PUBLIC_INCLUSION,
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
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { findUniqueVoteEvent } from "../models/voteEvent.db";

const router = Router();

router.get("/", authorizeVoter, async (_, res: Response) => {
  try {
    let voteEvents: VoteEvent[] = [];

    if (res.locals.userData) {
      const isUserAdmin = !!res.locals.userData.administrator?.id;

      voteEvents = isUserAdmin
        ? await getAllVoteEvents()
        : await getInternalVoterVoteEvents(res.locals.userData.id);
    }

    if (res.locals.voterId) {
      voteEvents = await getExternalVoterVoteEvents(res.locals.voterId);
    }

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
  authorizeVoter,
  authorizeVoterOfVoteEvent,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      let voteEvent: any = await getOneVoteEventById(Number(voteEventId));

      if (!res.locals.userData?.administrator?.id) {
        voteEvent = {
          ...voteEvent,
          voterManagement: {
            isRegistrationOpen: false,
          },
          resultsFilter: {
            areResultsPublished: voteEvent.resultsFilter?.areResultsPublished,
          },
        };
      }

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

router.post(
  "/:voteEventId/register",
  authorizeVoter,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    const { userData } = res.locals;

    if (!userData) {
      return routeErrorHandler(
        res,
        new SkylabError("Authentication failed", HttpStatusCode.UNAUTHORIZED)
      );
    }

    try {
      await addInternalVoter({
        body: {
          email: userData.email,
        },
        voteEventId: Number(voteEventId),
      });

      const voteEvent = await findUniqueVoteEvent({
        where: { id: Number(voteEventId) },
        include: VOTE_EVENT_PUBLIC_INCLUSION,
      });

      return apiResponseWrapper(res, {
        voteEvent: {
          ...voteEvent,
          voterManagement: {
            isRegistrationOpen: false,
          },
        },
      });
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

router.post(
  "/:voteEventId/voter-management/internal-voters/batch",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const internalVoters = await addManyInternalVoters({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { internalVoters });
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

router.post(
  "/:voteEventId/voter-management/external-voters/batch",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const externalVoters = await addManyExternalVoters({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { externalVoters });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/:voteEventId/voter-management/external-voters/generate",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const externalVoters = await generateExternalVoters({
        body: req.body,
        voteEventId: Number(voteEventId),
      });

      return apiResponseWrapper(res, { externalVoters });
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

router.get(
  "/:voteEventId/candidates",
  authorizeVoter,
  authorizeVoterOfVoteEvent,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    try {
      const candidates = await getAllCandidatesByVoteEvent(Number(voteEventId));

      return apiResponseWrapper(res, { candidates });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

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

router.get(
  "/:voteEventId/votes",
  authorizeVoter,
  authorizeVoterOfVoteEvent,
  async (req: Request, res: Response) => {
    const { voteEventId } = req.params;
    const { userData, voterId } = res.locals;

    try {
      const votes = await getVotesByVoteEventAndVoter(
        Number(voteEventId),
        userData ? userData.id : undefined,
        voterId
      );

      return apiResponseWrapper(res, { votes });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

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
  authorizeVoter,
  authorizeVoterOfVoteEvent,
  addVotesValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }

    const { voteEventId } = req.params;
    try {
      const votes = await addManyVotes({
        body: {
          projectIds: req.body.projectIds,
          userId: res.locals.userData?.id ?? undefined,
          externalVoterId: res.locals.voterId,
        },
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
  authorizeVoter,
  authorizeVoterOfVoteEvent,
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
