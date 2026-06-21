import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ContractorsModule } from "./contractors/contractors.module";
import { CustomersModule } from "./customers/customers.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { MapsModule } from "./maps/maps.module";
import { MessageTemplatesModule } from "./message-templates/message-templates.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env"],
      isGlobal: true
    }),
    PrismaModule,
    NotificationsModule,
    DashboardModule,
    ContractorsModule,
    CustomersModule,
    MapsModule,
    MessageTemplatesModule,
    ReportsModule,
    SettingsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
