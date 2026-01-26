import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "../errors/SkylabError";
import {
  createFaqMessage,
  createOneFaqConversation,
  findManyFaqConversationsWithMessageData,
  findUniqueFaqConversation,
  findUniqueFaqConversationWithMessageData,
  updateUniqueFaqConversation,
} from "../models/ai.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { getOpenAIClient } from "../utils/openai";
import { SYSTEM_PROMPT } from "./ai.faq.helper";

export async function getManyFaqConversationsWithFilter(query: {
  limit?: number;
  page?: number;
}) {
  const { limit, page } = query;
  /* Create Filter Object */
  const studentQuery: Prisma.FaqConversationFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
  };

  /* Fetch Students with Filter Object */
  const conversations = await findManyFaqConversationsWithMessageData(
    studentQuery
  );

  return conversations;
}

export async function getOneFaqConversationById(conversationId: number) {
  const conversation = await findUniqueFaqConversationWithMessageData({
    where: { id: conversationId },
  });
  return conversation;
}

export async function createFaqConversation(
  conversation: Prisma.FaqConversationCreateArgs
) {
  try {
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

  const response = await getOpenAIClient().chat(
    data.content,
    SYSTEM_PROMPT,
    history,
    onDelta
  );

  const assistantMessage = await createFaqMessage(conversation.id, {
    role: "ASSISTANT",
    content: response,
  });

  return { userMessage, assistantMessage };
}

export function isInputInvalid(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return true;
  }

  const alphaCount = trimmed.replace(/[^\p{L}]/gu, "").length;
  const alphaRatio = alphaCount / trimmed.length;

  const hasRepeatedChars = /(.)\1{4,}/.test(trimmed);

  const isInvalid = trimmed.length < 3 || alphaRatio < 0.3 || hasRepeatedChars;
  return isInvalid;
}
