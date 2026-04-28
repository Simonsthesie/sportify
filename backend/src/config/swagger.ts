import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Sportify Pro - API REST',
      version: '1.0.0',
      description: 'Documentation de l API de gestion de seances de coaching sportif.',
    },
    servers: [{ url: '/api', description: 'Base URL' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
});
