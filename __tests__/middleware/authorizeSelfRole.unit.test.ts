import { afterEach, describe, expect, it, jest } from "@jest/globals";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/server";
import * as usersDb from "../../src/models/users.db";
import * as dashboardStudentHelper from "../../src/helpers/dashboard.student.helper";

const BASE_URL = "/api/dashboard/student";

describe("authorizeSelfRole (regression for IDOR on /:studentId routes)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const withCookie = (req: supertest.Test) =>
    req.set("Cookie", ["token=validtoken"]);

  it("denies a student requesting another student's evaluations-feedbacks", async () => {
    jest.spyOn(jwt, "verify").mockReturnValue({ id: 1 } as never);
    jest.spyOn(usersDb, "findUniqueUserWithRoleData").mockResolvedValue({
      id: 1,
      administrator: {},
      student: { id: 111 },
    } as never);
    const helperSpy = jest.spyOn(
      dashboardStudentHelper,
      "getPeerEvaluationFeedbackByStudentID"
    );

    const response = await withCookie(
      supertest(app).get(`${BASE_URL}/999/evaluations-feedbacks`)
    );

    expect(response.status).toBe(401);
    expect(helperSpy).not.toHaveBeenCalled();
  });

  it("allows a student requesting their own evaluations-feedbacks", async () => {
    jest.spyOn(jwt, "verify").mockReturnValue({ id: 1 } as never);
    jest.spyOn(usersDb, "findUniqueUserWithRoleData").mockResolvedValue({
      id: 1,
      administrator: {},
      student: { id: 111 },
    } as never);
    jest
      .spyOn(dashboardStudentHelper, "getPeerEvaluationFeedbackByStudentID")
      .mockResolvedValue([] as never);

    const response = await withCookie(
      supertest(app).get(`${BASE_URL}/111/evaluations-feedbacks`)
    );

    expect(response.status).toBe(200);
  });

  it("allows an admin to request any student's evaluations-feedbacks", async () => {
    jest.spyOn(jwt, "verify").mockReturnValue({ id: 2 } as never);
    jest.spyOn(usersDb, "findUniqueUserWithRoleData").mockResolvedValue({
      id: 2,
      administrator: { id: 1 },
    } as never);
    jest
      .spyOn(dashboardStudentHelper, "getPeerEvaluationFeedbackByStudentID")
      .mockResolvedValue([] as never);

    const response = await withCookie(
      supertest(app).get(`${BASE_URL}/999/evaluations-feedbacks`)
    );

    expect(response.status).toBe(200);
  });
});
