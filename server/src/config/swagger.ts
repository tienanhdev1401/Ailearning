import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AelanG API",
      version: "1.0.0",
    },
    components: {
      schemas: {
        // Trùng tên với @swagger components trong DTO
        LoginDto: {},
        RegisterDto: {},
        CreateUserDto: {},
        UpdateUserDto: {},
        CreateLessonDto: {},
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
  // Nơi swagger-jsdoc tìm các comment @swagger trong file
  apis: ["./src/routes/*.routes.ts", "./src/dto/request/*.ts"] 
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };