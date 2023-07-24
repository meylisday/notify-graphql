import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, parse, validate } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { getSchema } from './schema.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;
  const schema = getSchema(prisma);

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const { query, variables } = req.body;
      const document = parse(query);
      const validationErrors = validate(schema, document, [depthLimit(5)]);

      if (validationErrors.length > 0) {
        return {
          data: null,
          errors: validationErrors,
        };
      }

      try {
        const result = await graphql({
          schema: schema,
          source: query,
          variableValues: variables,
          contextValue: { prisma },
        });

        return {
          data: result.data,
          errors: result.errors ?? null,
        };
      } catch (error) {
        return {
          data: null,
          errors: [error],
        };
      }
    },
  });
};

export default plugin;