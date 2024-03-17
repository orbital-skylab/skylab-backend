import { faker } from "@faker-js/faker";
import { ForumCategory, type PrismaClient } from "@prisma/client";
import { NUM_POSTS } from "./seed.constants";

export const seedForumPosts = async (prisma: PrismaClient) => {
  for (let i = 1; i <= NUM_POSTS; i++) {
    const userId = faker.datatype.number({ min: 1, max: 401 });

    await prisma.forumPost.create({
      data: {
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraphs(),
        category: faker.helpers.arrayElement(Object.values(ForumCategory)),
        userId: userId,
      },
    });
  }
};
