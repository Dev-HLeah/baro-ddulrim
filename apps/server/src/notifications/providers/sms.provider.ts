import { Injectable, Logger } from "@nestjs/common";

export type SmsMessage = {
  to: string;
  text: string;
};

/**
 * 문자 발송 추상화. 실제 provider(솔라피/NHN 등)는 업체 선정 후 결정 예정.
 * 현재는 발송 시도를 로그로만 남기는 no-op 구현체.
 * provider가 정해지면 이 클래스의 send()만 실제 API 호출로 교체하면 된다.
 */
@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  get enabled(): boolean {
    return false;
  }

  async send(message: SmsMessage): Promise<void> {
    this.logger.log(
      `[문자 미설정] 발송 예정 → to=${message.to}, text=${message.text.slice(0, 40)}…`
    );
  }
}
