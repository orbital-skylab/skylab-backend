export const SUBJECT = "NUS Orbital Skylab Account Password Reset";
export const SENDER = {
  name: "NUS Orbital Skylab",
  email: "nvjn37@gmail.com",
};
export const GET_HTML_CONTENT = (origin: string, token: string, id: number) =>
  `<html><body>You can use this link to reset you password: ${origin}/change-password?token=${token}&id=${id}</body></html`;
