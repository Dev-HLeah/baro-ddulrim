import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateMessageTemplateDto, UpdateMessageTemplateDto } from "./dto/message-template.dto";
import { MessageTemplatesService } from "./message-templates.service";

@Controller("message-templates")
export class MessageTemplatesController {
  constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

  @Get()
  async findAll() {
    return this.messageTemplatesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateMessageTemplateDto) {
    return this.messageTemplatesService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateMessageTemplateDto) {
    return this.messageTemplatesService.update(id, dto);
  }
}
