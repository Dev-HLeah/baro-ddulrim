import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ContractorsController } from "./contractors.controller";
import { ContractorsService } from "./contractors.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContractorsController],
  providers: [ContractorsService]
})
export class ContractorsModule {}
