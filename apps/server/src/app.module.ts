import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ContractorsModule } from "./contractors/contractors.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env"],
      isGlobal: true
    }),
    PrismaModule,
    DashboardModule,
    ContractorsModule,
    ReportsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
