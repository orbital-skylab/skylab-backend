import { Request, Response, Router } from "express";

const healthCheckRouter = Router();

healthCheckRouter.get("/", (_: Request, res: Response) => {
  return res.status(200).send("Server is healthy");
});

export default healthCheckRouter;
