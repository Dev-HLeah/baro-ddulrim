import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async findAll() {
    return this.settingsService.findAll();
  }

  @Patch(":key")
  async update(@Param("key") key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(key, dto);
  }
}
