/**
 * Base class for Error classes
 * @param message - message for native Error class
 * @param code - code of error
 * @param data - any debug data for development
 */
export class HttpError extends Error {
  private readonly _code: number;
  private readonly _data: any;

  constructor(
    message: string,
    code: number = 500,
    data: any = null,
  ) {
    super(message);
    this._code = code;
    this._data = data;
  }

  public get code(): number {
    return this._code;
  }

  public get data(): any {
    return this._data;
  }

  public response(): HttpErrorResponse {
    return ({
      code: this._code,
      message: this.message,
      data: this._data,
    });
  }
}

export class HttpErrorResponse {
  public code: number;
  public message: string;
  public data?: any;
}

export class BadRequestError extends HttpError {
  constructor(data: any = null) {
    super('Bad Request', 400, data);
  }
}

export class NotFoundError extends HttpError {
  constructor(data: any = null) {
    super('Not Found', 404, data);
  }
}

export class InternalServerError extends HttpError {
  constructor(data: any = null) {
    super('Internal Server Error', 500, data);
  }
}
