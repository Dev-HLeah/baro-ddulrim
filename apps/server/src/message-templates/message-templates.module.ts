import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { MessageTemplatesController } from "./message-templates.controller";
import { MessageTemplatesService } from "./message-templates.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MessageTemplatesController],
  providers: [MessageTemplatesService]
})
export class MessageTemplatesModule {}
