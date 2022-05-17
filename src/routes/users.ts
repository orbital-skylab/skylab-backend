import { Router, Request, Response } from "express";
import { createUser, getAllUsers } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.body.user) {
      throw Error("One of the function arguments is missing");
    }

    await createUser(req.body.user);
    res.status(HttpStatusCode.OK).json("User created successfully");
  } catch (e) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const allUsers = await getAllUsers();
    res.status(HttpStatusCode.OK).json(allUsers);
  } catch (e) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
  }
});

export default router;
