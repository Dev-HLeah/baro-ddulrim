import { Global, Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { EmailProvider } from "./providers/email.provider";
import { PushProvider } from "./providers/push.provider";
import { SmsProvider } from "./providers/sms.provider";

@Global()
@Module({
  providers: [NotificationsService, EmailProvider, SmsProvider, PushProvider],
  exports: [NotificationsService]
})
export class NotificationsModule {}
