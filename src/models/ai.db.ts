import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { prisma } from "../client";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

type CreateFaqMessageInput = {
  role: MessageRole;
  content: string;
};
type MessageRole = "USER" | "ASSISTANT";

/**
 * @function findFirstFaqConversation
 * Retrieves the first FAQ conversation matching the provided query criteria.
 * @param query - The Prisma FindFirst query arguments to filter the FAQ conversation
 * @returns A promise that resolves to the first matching FAQ conversation
 * @throws {SkylabError} If no FAQ conversation is found, throws an error with status BAD_REQUEST
 */
export async function findFirstFaqConversation({
  ...query
}: Prisma.FaqConversationFindFirstArgs) {
  const firstFaqConversation = await prisma.faqConversation.findFirst({
    ...query,

    rejectOnNotFound: false,
  });
  if (!firstFaqConversation) {
    throw new SkylabError(
      "FAQ Conversation was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return firstFaqConversation;
}

/**
 * @function findUniqueFaqConversation
 * Finds a unique FAQ conversation by the specified query parameters.
 * @param query - The Prisma query parameters for finding a unique FAQ conversation
 * @returns The unique FAQ conversation object
 * @throws {SkylabError} When the FAQ conversation is not found, throws an error with status code BAD_REQUEST
 */
export async function findUniqueFaqConversation(
  query: Prisma.FaqConversationFindUniqueArgs
) {
  const uniqueFaqConversation = await prisma.faqConversation.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueFaqConversation) {
    throw new SkylabError(
      "FAQ Conversation was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return uniqueFaqConversation;
}

/**
 * @function findUniqueFaqConversationWithMessageData
 * Retrieves a unique FAQ conversation with its associated message data.
 *
 * @param {Object} params - The query parameters
 * @param {Prisma.FaqConversationInclude} [params.include] - Additional fields to include in the result
 * @param {Prisma.FaqConversationFindUniqueArgs} params - Prisma FindUnique arguments for FaqConversation
 *
 * @returns {Promise<Prisma.FaqConversationGetPayload<{ include: { messages: true } }>>} The found FAQ conversation with messages
 *
 * @throws {SkylabError} Throws a SkylabError with BAD_REQUEST status if the FAQ conversation is not found
 */
export async function findUniqueFaqConversationWithMessageData({
  include,
  ...query
}: Prisma.FaqConversationFindUniqueArgs) {
  const uniqueFaqConversation = await prisma.faqConversation.findUnique({
    include: {
      ...include,
      messages: true,
    },
    ...query,
    rejectOnNotFound: false,
  });

  if (!uniqueFaqConversation) {
    throw new SkylabError(
      "FAQ Conversation was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return uniqueFaqConversation;
}

/**
 * @function findManyFaqConversationsWithMessageData
 * Retrieves multiple FAQ conversations with their associated message data (2 most recent messages).
 *
 * Fetches FAQ conversations with pagination support and includes the two most recent messages
 * for each conversation, ordered by creation date in descending order.
 *
 * @param {Object} params - The query parameters
 * @param {Prisma.FaqConversationInclude} [params.include] - Additional relations to include in the result
 * @param {number} [params.take=10] - Number of conversations to retrieve per page
 * @param {number} [params.skip] - Number of conversations to skip for pagination
 * @param {Prisma.FaqConversationFindManyArgs} params - Additional Prisma query arguments
 *
 * @returns {Promise<{conversations: Prisma.FaqConversation[], hasMore: boolean}>}
 * An object containing:
 * - `conversations`: Array of FAQ conversations with message data (2 most recent messages)
 * - `hasMore`: Boolean indicating if there are more results beyond the current page
 */
export async function findManyFaqConversationsWithMessageData({
  include,
  take,
  skip,
  ...query
}: Prisma.FaqConversationFindManyArgs) {
  const pageSize = take ?? 10;

  const results = await prisma.faqConversation.findMany({
    take: pageSize + 1,
    skip,
    orderBy: { createdAt: "desc" },
    include: {
      ...include,
      messages: {
        take: 2,
        orderBy: { createdAt: "desc" },
      },
    },
    ...query,
  });

  const hasMore = results.length > pageSize;
  const faqConversations = hasMore ? results.slice(0, pageSize) : results;

  return {
    faqConversations,
    hasMore,
  };
}

/**
 * @function createOneFaqConversation
 * Creates a new FAQ conversation record in the database.
 * @param conversation - The FAQ conversation data to create, following Prisma's FaqConversationCreateArgs structure.
 * @returns A promise that resolves to the created FAQ conversation object.
 * @throws {SkylabError} If the conversation data is not unique (code P2002), throws with BAD_REQUEST status.
 * @throws {SkylabError} If any other database error occurs, throws with BAD_REQUEST status.
 * @throws {PrismaClientKnownRequestError} If an unexpected Prisma error occurs that is not a known request error.
 */
export async function createOneFaqConversation(
  conversation: Prisma.FaqConversationCreateArgs
) {
  try {
    return await prisma.faqConversation.create(conversation);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "FAQ Conversation is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

/**
 * @function createFaqMessage
 * Creates a new FAQ message associated with a conversation.
 *
 * @param conversationId - The ID of the conversation to associate the message with
 * @param data - The input data for creating the FAQ message
 * @returns A promise that resolves to the created message object
 * @throws {SkylabError} If a Prisma database error occurs, wrapped with HTTP status code and metadata
 * @throws {Error} If an unexpected error occurs that is not a known Prisma error
 */
export async function createFaqMessage(
  conversationId: number,
  data: CreateFaqMessageInput
) {
  try {
    return await prisma.message.create({
      data: {
        ...data,
        conversation: {
          connect: { id: conversationId },
        },
      },
    });
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

/**
 * @function updateUniqueFaqConversation
 * Updates a single FAQ conversation record in the database.
 * @param query - The Prisma update arguments containing the FAQ conversation data and filter conditions
 * @returns A promise that resolves to the updated FAQ conversation object
 * @throws {SkylabError} If a known Prisma error occurs, wrapped with a BAD_REQUEST status code
 * @throws {Error} If an unknown error occurs during the update operation
 */
export async function updateUniqueFaqConversation(
  query: Prisma.FaqConversationUpdateArgs
) {
  try {
    return await prisma.faqConversation.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}

/**
 * @function deleteUniqueFaqConversation
 * Deletes a unique FAQ conversation from the database.
 * @param query - The Prisma delete query arguments specifying which FAQ conversation to delete
 * @returns A promise that resolves to the deleted FAQ conversation object
 * @throws {SkylabError} If a Prisma client error occurs, wrapped with HTTP 400 status code
 * @throws {Error} If a non-Prisma error occurs during deletion
 */
export async function deleteUniqueFaqConversation(
  query: Prisma.FaqConversationDeleteArgs
) {
  try {
    return await prisma.faqConversation.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}
