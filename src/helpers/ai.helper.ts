import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "../errors/SkylabError";
import {
  createFaqMessage,
  createOneFaqConversation,
  deleteManyFaqConversations,
  deleteUniqueFaqConversation,
  findManyFaqConversationsWithMessageData,
  findUniqueFaqConversation,
  findUniqueFaqConversationWithMessageData,
  updateUniqueFaqConversation,
} from "../models/ai.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { getOpenAIClient } from "../utils/openai";
import { inferNamespacesFromQuery, SYSTEM_PROMPT } from "./ai.faq.helper";
import { getPineconeClient } from "../utils/pinecone";

export async function getManyFaqConversationsWithFilter(query: {
  limit?: number;
  page?: number;
  order?: "asc" | "desc";
}) {
  const { limit, page, order } = query;
  /* Create Filter Object */
  const studentQuery: Prisma.FaqConversationFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
    orderBy: order ? { createdAt: order } : undefined,
  };

  /* Fetch Students with Filter Object */
  const result = await findManyFaqConversationsWithMessageData(studentQuery);

  return result;
}

export async function getOneFaqConversationById(conversationId: number) {
  const conversation = await findUniqueFaqConversationWithMessageData({
    where: { id: conversationId },
  });
  return conversation;
}

export async function createFaqConversation(
  conversation: Prisma.FaqConversationCreateArgs,
  content?: string
) {
  try {
    if (content) {
      const title = await getOpenAIClient().getTitle(content);
      conversation.data.title = title;
    }
    return await createOneFaqConversation(conversation);
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

export async function ensureFaqConversationExists(
  userId: number,
  conversationId?: number
) {
  if (conversationId) {
    const convo = await findUniqueFaqConversation({
      where: { id: conversationId },
    });
    if (!convo) {
      throw new SkylabError(
        "FAQ conversation not found",
        HttpStatusCode.NOT_FOUND
      );
    }
    return convo;
  }

  return createOneFaqConversation({
    data: { userId },
  });
}

export async function postFaqMessage(
  data: {
    conversationId: number;
    content: string;
  },
  onDelta: (chunk: string) => void
) {
  const pineconeClient = getPineconeClient();
  const conversation = await findUniqueFaqConversationWithMessageData({
    where: { id: data.conversationId },
  });
  if (!conversation) {
    throw new SkylabError(
      "FAQ conversation not found",
      HttpStatusCode.NOT_FOUND
    );
  }

  const history = conversation.messages;

  const userMessage = await createFaqMessage(conversation.id, {
    role: "USER",
    content: data.content,
  });

  // Generate conversation title if it doesn't exist
  if (!conversation.title) {
    void (async () => {
      try {
        const title = await getOpenAIClient().getTitle(data.content);

        await updateUniqueFaqConversation({
          where: { id: conversation.id },
          data: { title },
        });
      } catch (e) {
        console.error("Failed to generate title for conversation:", e);
      }
    })();
  }

  // Check for invalid input
  if (isInputInvalid(data.content)) {
    const clarification =
      "I'm not quite sure what you mean. Could you rephrase your question or add more detail?";

    const assistantMessage = await createFaqMessage(conversation.id, {
      role: "ASSISTANT",
      content: clarification,
    });

    return { userMessage, assistantMessage };
  }

  const inputEmbedding = await getOpenAIClient().getEmbedding(data.content);
  const namespaces = inferNamespacesFromQuery(data.content);
  const semanticSearchResults = await pineconeClient.query(
    inputEmbedding,
    namespaces,
    5
  );

  const context = semanticSearchResults
    .map((m, i) => {
      const text = m.metadata?.text?.toString();
      return `
        Context ${i + 1}\n
        FILE: ${m.metadata?.file ?? "Unknown"}\n
        NAMESPACE: ${m.metadata?.namespace ?? "Unknown"}\n
        URL: ${m.metadata?.url ?? "Unknown"}\n
        CONTENT: ${text}
      `;
    })
    .filter(Boolean)
    .join("\n---------------------------------------------\n");

  const response = await getOpenAIClient().getResponse(
    data.content,
    SYSTEM_PROMPT,
    history,
    onDelta,
    context
  );

  const assistantMessage = await createFaqMessage(conversation.id, {
    role: "ASSISTANT",
    content: response,
  });

  return { userMessage, assistantMessage };
}

export function isInputInvalid(content: string): boolean {
  // remove whitespace
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return true;
  }

  const alphaCount = trimmed.replace(/[^\p{L}]/gu, "").length;
  const alphaRatio = alphaCount / trimmed.length;

  // repeated characters (at least 5 times)
  const hasRepeatedChars = /(.)\1{4,}/.test(trimmed);

  // too short
  const isTooShort = trimmed.length < 3;

  const isInvalid = isTooShort || alphaRatio < 0.3 || hasRepeatedChars;
  return isInvalid;
}

export async function deleteOneConversationByConversationId(
  conversationId: number
) {
  const deletedConversation = await deleteUniqueFaqConversation({
    where: { id: conversationId },
  });
  return deletedConversation;
}

export async function deleteManyConversationsByConversationIds(
  conversationIds: number[]
) {
  if (conversationIds.length === 0) {
    return { count: 0 };
  }

  const result = await deleteManyFaqConversations({
    where: {
      id: {
        in: conversationIds,
      },
    },
  });

  return result;
}
