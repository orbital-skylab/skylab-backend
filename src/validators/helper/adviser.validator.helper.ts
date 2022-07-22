import { prisma } from "src/client";

export async function checkAdviserIdExists(adviserId: number) {
  try {
    const adviser = await prisma.adviser.findUnique({
      where: { id: adviserId },
    });
    return adviser ? true : false;
  } catch (e) {
    return false;
  }
}
