import {
  APIError,
  ConnectionError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestError,
} from '../../src/core/error';

describe('Core API Error', () => {
  it('makeMessage contains code/desc when present', () => {
    const err = new APIError(400, { code: 'X', desc: 'desc' } as any, 'msg', new Headers());
    expect(err.message).toContain('desc');
    expect(err.message).toContain('code: X');
  });

  it('generateError returns ConnectionError when status or headers missing', () => {
    const c1 = APIError.generateError(undefined, undefined, undefined, undefined);
    expect(c1).toBeInstanceOf(ConnectionError);
  });

  it('generateError returns specific subclass for status codes', () => {
    const headers = new Headers();
    expect(APIError.generateError(400, { code: 'c', desc: 'd' }, undefined, headers)).toBeInstanceOf(
      BadRequestError,
    );
    expect(APIError.generateError(401, { code: 'c', desc: 'd' }, undefined, headers)).toBeInstanceOf(
      UnauthorizedError,
    );
    expect(APIError.generateError(403, { code: 'c', desc: 'd' }, undefined, headers)).toBeInstanceOf(
      ForbiddenError,
    );
    expect(APIError.generateError(404, { code: 'c', desc: 'd' }, undefined, headers)).toBeInstanceOf(
      NotFoundError,
    );
    expect(APIError.generateError(429, { code: 'c', desc: 'd' }, undefined, headers)).toBeInstanceOf(
      TooManyRequestError,
    );
  });
});
