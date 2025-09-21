import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerSchemas } from "./swaggerSchemas.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AelanG API",
    },
    components: {
      schemas: {
        Login: swaggerSchemas.loginSchema,
        Register: swaggerSchemas.registerSchema,
        CreateUser: swaggerSchemas.createUserSchema,
        UpdateUser: swaggerSchemas.updateUserSchema,
        CreateLesson: swaggerSchemas.createLessonSchema,

      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };
