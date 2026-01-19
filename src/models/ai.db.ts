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

export async function findManyFaqConversationsWithMessageData({
  include,
  ...query
}: Prisma.FaqConversationFindManyArgs) {
  const manyFaqConversations = await prisma.faqConversation.findMany({
    include: {
      ...include,
      messages: {
        take: 2,
        orderBy: { createdAt: "desc" },
      },
    },
    ...query,
  });
  return manyFaqConversations;
}

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
