import { Request, Response, NextFunction } from "express";
import { routeErrorHandler } from "src/utils/ApiResponseWrapper";

const isSameEvaluationGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    next();
  } catch (e) {
    routeErrorHandler(res, e);
  }
};

export default isSameEvaluationGroup;
