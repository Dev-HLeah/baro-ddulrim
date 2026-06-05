import { BadRequestException, Injectable } from "@nestjs/common";
import { toIso } from "../common/format";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingDto } from "./dto/update-setting.dto";

const allowedSettings: Record<string, string[]> = {
  ai_provider: ["openai", "gemini"],
  map_provider: ["kakao", "naver"],
  customer_lookup_mode: ["development_phone_only", "verification_required"]
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const settings = await this.prisma.appSetting.findMany({
      orderBy: { key: "asc" }
    });

    return settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: setting.value,
      updatedAt: toIso(setting.updatedAt)
    }));
  }

  async update(key: string, dto: UpdateSettingDto) {
    const allowedValues = allowedSettings[key];

    if (!allowedValues) {
      throw new BadRequestException("변경할 수 없는 설정입니다.");
    }

    if (!allowedValues.includes(dto.value)) {
      throw new BadRequestException("허용되지 않은 설정값입니다.");
    }

    const setting = await this.prisma.appSetting.upsert({
      where: { key },
      update: { value: dto.value },
      create: { key, value: dto.value }
    });

    return {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      updatedAt: toIso(setting.updatedAt)
    };
  }
}
