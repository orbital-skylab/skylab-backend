export const SUBJECT = "NUS Orbital Skylab Account Password Reset";
export const SENDER = {
  name: "NUS Orbital Skylab",
  email: "nusskylab@gmail.com",
};
export const GET_HTML_CONTENT = (origin: string, token: string, id: number) =>
  `<html><body>You can use this link to reset you password: ${origin}/change-password?token=${token}&id=${id}</body></html>`;

export const GET_HTML_CONTENT_REMINDER = (message: string) =>
  `<html><body>${message
    .replace(/\n/g, "<br>")
    .replace(/\t/g, "&emsp;")}</body></html>`;
