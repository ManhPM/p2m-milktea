"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookieParserConfig = require("cookie-parser");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.use(cookieParserConfig());
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: ['https://tea-z-navy.vercel.app'],
        methods: ['GET', 'POST', 'HEAD', 'PATCH', 'PUT', 'DELETE'],
        allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
        credentials: true,
    });
    await app.listen(4000);
}
bootstrap();
//# sourceMappingURL=main.js.map