import { Router, Request, Response } from "express";
import {
  createUser,
  deleteUserByEmail,
  getAllUsers,
  getUserByEmail,
  updateUserByEmail,
} from "src/models/users.db";
import { apiCallArgumentsMissingError } from "src/utils/errors";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .post("/", async (req: Request, res: Response) => {
    try {
      if (!req.body.user) {
        throw apiCallArgumentsMissingError;
      }

      await createUser(req.body.user);
      res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    }
  })
  .get("/", async (_: Request, res: Response) => {
    try {
      const allUsers = await getAllUsers();
      res.status(HttpStatusCode.OK).json(allUsers);
    } catch (e) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    }
  })
  .all("/", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router
  .get("/:email", async (req: Request, res: Response) => {
    try {
      if (!req.params.email) {
        throw apiCallArgumentsMissingError;
      }

      const email = req.params.email;
      const user = await getUserByEmail(email);
      res.status(HttpStatusCode.OK).json(user);
    } catch (e) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    }
  })
  .delete("/:email", async (req: Request, res: Response) => {
    try {
      if (!req.params.email) {
        res
          .status(HttpStatusCode.BAD_REQUEST)
          .send("Missing request parameters");
      }

      const email = req.params.email;
      await deleteUserByEmail(email);
      res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    }
  })
  .put("/:email", async (req: Request, res: Response) => {
    if (!req.params.email || !req.body.user) {
      res.status(HttpStatusCode.BAD_REQUEST).send("Missing request parameters");
    }

    const email = req.params.email;
    const user = req.body.user;
    await updateUserByEmail(email, user);
    res.sendStatus(HttpStatusCode.OK);
  })
  .all("/:email", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

export default router;
