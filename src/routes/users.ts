import { Router, Request, Response } from "express";
import {
  createManyUsers,
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
  .post("/batch", async (req: Request, res: Response) => {
    try {
      if (!req.body.users || !req.body.count) {
        throw apiCallArgumentsMissingError;
      }

      const { users, count } = req.body;

      if (users.length !== count) {
        res
          .status(HttpStatusCode.BAD_REQUEST)
          .send("Number of users do not tally");
      }

      const createAllUsers = await createManyUsers(users);
      res
        .status(HttpStatusCode.OK)
        .send(`${createAllUsers} users were created`);
    } catch (e) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    }
  })
  .all("/batch", (_: Request, res: Response) => {
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
