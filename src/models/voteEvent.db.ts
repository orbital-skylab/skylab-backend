import { Prisma } from "@prisma/client";
import { prisma } from "../client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

export async function findManyVoteEvents(query: Prisma.VoteEventFindManyArgs) {
  const manyVoteEvents = await prisma.voteEvent.findMany(query);
  return manyVoteEvents;
}

export async function findUniqueVoteEvent(
  query: Prisma.VoteEventFindUniqueArgs
) {
  const uniqueVoteEvent = await prisma.voteEvent.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueVoteEvent) {
    throw new SkylabError(
      "Vote event was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return uniqueVoteEvent;
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
