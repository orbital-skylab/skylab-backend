import { getOneUser } from "src/models/users.db";

export const checkUserExistsWithID = async (userId: number) => {
  try {
    const user = await getOneUser({ where: { id: userId } });
    return user ? true : false;
  } catch (e) {
    return false;
  }
};

export const checkUserExistsWithEmail = async (email: string) => {
  try {
    const user = await getOneUser({ where: { email: email } });
    return user ? true : false;
  } catch (e) {
    return false;
  }
};
