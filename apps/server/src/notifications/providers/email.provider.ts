import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Gmail SMTP 기반 메일 발송기.
 * GMAIL_USER / GMAIL_APP_PASSWORD 가 설정되지 않으면 발송을 건너뛰고 로그만 남긴다.
 * (운영 발송량이 늘면 SendGrid/SES 구현체로 교체)
 */
@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: Transporter | null = null;
  private readonly from: string | null;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>("GMAIL_USER");
    const pass = this.config.get<string>("GMAIL_APP_PASSWORD");
    this.from = this.config.get<string>("MAIL_FROM") ?? user ?? null;

    if (user && pass) {
      this.transporter = createTransport({
        service: "gmail",
        auth: { user, pass }
      });
    }
  }

  get enabled(): boolean {
    return this.transporter !== null;
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transporter || !this.from) {
      this.logger.warn(
        `메일 미설정으로 발송 건너뜀 → to=${message.to}, subject=${message.subject}`
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html
      });
      this.logger.log(`메일 발송 완료 → ${message.to}`);
    } catch (error) {
      this.logger.error(`메일 발송 실패 → ${message.to}`, error as Error);
    }
  }
}
