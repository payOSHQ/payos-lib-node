export const castToError = (err: any) => {
  if (err instanceof Error) {
    return err;
  }
  if (typeof err === 'object' && err !== null) {
    try {
      if (Object.prototype.toString.call(err) === '[object Error]') {
        const error = new Error(err.message);
        if (err.stack) {
          error.stack = err.stack;
        }
        if (err.name) {
          error.name = err.name;
        }
        return error;
      }
    } catch {
      /* empty */
    }
    try {
      return new Error(JSON.stringify(err));
    } catch {
      /* empty */
    }
  }
  return new Error(err);
};
