// logger.middleware.ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { logger } from "src/logger/winston.logger";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const logMessage = `[${method}] ${originalUrl} ${res.statusCode} - ${duration}ms`;

      // Log error if status code is 4xx or 5xx
      if (res.statusCode >= 400) {
        logger.error(logMessage);
      } else {
        logger.info(logMessage);
      }
    });

    next();
  }
}
