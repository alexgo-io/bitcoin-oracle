import xgot, { BeforeErrorHook, HandlerFunction, RequestError } from 'got-cjs';

const stackTraceHandler: HandlerFunction = (options, next) => {
  const context: { stack?: string } = {};
  Error.captureStackTrace(context, stackTraceHandler);
  options.context = { ...options.context, stack: context['stack'] };
  return next(options);
};

const addSourceStackTraceToError: BeforeErrorHook = (error: RequestError) => {
  error.stack = `${error.stack}\n---Source Stack---\n${error.options.context['stack']}`;
  return error;
};

const extendedGot = xgot.extend({
  handlers: [stackTraceHandler],
  hooks: {
    beforeError: [addSourceStackTraceToError],
  },
});

export const got = extendedGot;
