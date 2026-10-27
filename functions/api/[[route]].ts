import app from '../../src/server/index';

export const onRequest: PagesFunction<any> = async (context) => {
  return app.fetch(context.request, context.env, context as any);
};
