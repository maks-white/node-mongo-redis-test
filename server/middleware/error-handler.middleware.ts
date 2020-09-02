import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Response, Request } from 'express';
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
  HttpErrorResponse,
} from '../services/error.service';


@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {

  public error(error: HttpErrorResponse | any, request: Request, response: Response, next: (err: any) => any) {

    console.log('BadRequestError:', error instanceof BadRequestError);
    console.log('NotFoundError:', error instanceof NotFoundError);
    console.log('InternalServerError:', error instanceof InternalServerError);

    switch (true) {
      case error instanceof BadRequestError:
        console.info(error);
        return response.send(error.response());
      case error instanceof NotFoundError:
        console.info(error);
        return response.send(error.response());
      case error instanceof InternalServerError:
        console.info(error);
        return response.send(error.response());
      default:
        console.info(error);
        return response.send(error.response());
    }
  }
}
