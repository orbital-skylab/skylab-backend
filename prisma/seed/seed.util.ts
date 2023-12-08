import bcrypt from "bcrypt";

export const generateNUniqueRandomStrings = (
  N: number,
  generateRandomString: () => string
) => {
  const generatedStrings = new Set<string>();
  for (let i = 0; i < N; i++) {
    let nextString = generateRandomString();
    while (generatedStrings.has(nextString)) {
      nextString = generateRandomString();
    }
    generatedStrings.add(nextString);
  }
  return Array.from(generatedStrings);
};

export const generateHashedPassword = async () => {
  const password = await bcrypt.hash(
    process.env.ADMIN_PASSWORD as string,
    parseInt(process.env.SALT_ROUNDS as string)
  );

  return password;
};
