import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  cert,
  getApps,
  initializeApp,
  type App
} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

export type PushMessage = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * FCM 푸시 발송기.
 * FCM_PROJECT_ID / FCM_CLIENT_EMAIL / FCM_PRIVATE_KEY 가 설정되지 않으면 건너뛴다.
 * 디바이스 토큰 저장/조회는 모바일 앱(Flutter) 연동 시점에 도입 예정이라,
 * 현재는 호출부에서 토큰 목록을 전달하지 않으면 자연스럽게 no-op 으로 동작한다.
 */
@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);
  private app: App | null = null;

  constructor(private readonly config: ConfigService) {
    const projectId = this.config.get<string>("FCM_PROJECT_ID");
    const clientEmail = this.config.get<string>("FCM_CLIENT_EMAIL");
    const privateKey = this.config
      .get<string>("FCM_PRIVATE_KEY")
      ?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      this.app =
        getApps()[0] ??
        initializeApp({
          credential: cert({ projectId, clientEmail, privateKey })
        });
    }
  }

  get enabled(): boolean {
    return this.app !== null;
  }

  async send(message: PushMessage): Promise<void> {
    const tokens = message.tokens.filter(Boolean);

    if (!this.app || tokens.length === 0) {
      if (tokens.length > 0) {
        this.logger.warn(`FCM 미설정으로 푸시 건너뜀 → ${tokens.length}개 토큰`);
      }
      return;
    }

    try {
      const response = await getMessaging(this.app).sendEachForMulticast({
        tokens,
        notification: { title: message.title, body: message.body },
        data: message.data
      });
      this.logger.log(
        `푸시 발송 완료 → 성공 ${response.successCount}/${tokens.length}`
      );
    } catch (error) {
      this.logger.error("푸시 발송 실패", error as Error);
    }
  }
}
