import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { prisma } from "../client";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

// --- Vote Event DB Functions ---

export async function findManyVoteEvents(query: Prisma.VoteEventFindManyArgs) {
  try {
    const manyVoteEvents = await prisma.voteEvent.findMany(query);
    return manyVoteEvents;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
}

export async function findUniqueVoteEvent(
  query: Prisma.VoteEventFindUniqueArgs
) {
  try {
    const uniqueVoteEvent = await prisma.voteEvent.findUnique({
      ...query,
      rejectOnNotFound: false,
    });
    return uniqueVoteEvent;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
}

export async function createOneVoteEvent(query: Prisma.VoteEventCreateArgs) {
  try {
    const newVoteEvent = await prisma.voteEvent.create(query);
    return newVoteEvent;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
}

export async function updateVoteEvent(query: Prisma.VoteEventUpdateArgs) {
  try {
    return await prisma.voteEvent.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function deleteVoteEvent(query: Prisma.VoteEventDeleteArgs) {
  try {
    return await prisma.voteEvent.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

// --- External Voter DB Functions ---

export async function findManyExternalVoters(
  query: Prisma.ExternalVoterFindManyArgs
) {
  try {
    const manyExternalVoters = await prisma.externalVoter.findMany(query);
    return manyExternalVoters;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function createExternalVoter(
  query: Prisma.ExternalVoterCreateArgs
) {
  try {
    return await prisma.externalVoter.create(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function deleteExternalVoter(
  query: Prisma.ExternalVoterDeleteArgs
) {
  try {
    return await prisma.externalVoter.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

// --- Votes DB Functions ---

export async function findManyVotes(query: Prisma.VoteFindManyArgs) {
  try {
    const manyVotes = await prisma.vote.findMany(query);
    return manyVotes;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function createManyVotes(query: Prisma.VoteCreateManyArgs) {
  try {
    return await prisma.vote.createMany(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function deleteVote(query: Prisma.VoteDeleteArgs) {
  try {
    return await prisma.vote.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}
