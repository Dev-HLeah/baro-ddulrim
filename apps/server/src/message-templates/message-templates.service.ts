import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { toIso } from "../common/format";
import { TemplateChannel } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMessageTemplateDto, UpdateMessageTemplateDto } from "./dto/message-template.dto";

@Injectable()
export class MessageTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const templates = await this.prisma.messageTemplate.findMany({
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      include: {
        versions: {
          orderBy: { versionNo: "desc" }
        },
        _count: {
          select: {
            usages: true,
            versions: true
          }
        }
      }
    });

    return templates.map((template) => this.serializeTemplate(template));
  }

  async create(dto: CreateMessageTemplateDto) {
    const name = this.requireCleanString(dto.name, "템플릿 이름을 입력해 주세요.");
    const content = this.requireCleanString(dto.content, "템플릿 내용을 입력해 주세요.");
    const channel = dto.channel ?? TemplateChannel.WEB;

    const template = await this.prisma.messageTemplate.create({
      data: {
        name,
        channel,
        content,
        isActive: dto.isActive ?? true,
        versions: {
          create: {
            versionNo: 1,
            content
          }
        }
      },
      include: this.templateInclude()
    });

    return this.serializeTemplate(template);
  }

  async update(id: string, dto: UpdateMessageTemplateDto) {
    const current = await this.prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNo: "desc" },
          take: 1
        }
      }
    });

    if (!current) {
      throw new NotFoundException("템플릿을 찾을 수 없습니다.");
    }

    const nextName = dto.name === undefined ? current.name : this.requireCleanString(dto.name, "템플릿 이름을 입력해 주세요.");
    const nextContent =
      dto.content === undefined
        ? current.content
        : this.requireCleanString(dto.content, "템플릿 내용을 입력해 주세요.");
    const latestVersion = current.versions[0];
    const contentChanged = dto.content !== undefined && latestVersion?.content !== nextContent;

    const updated = await this.prisma.$transaction(async (tx) => {
      const template = await tx.messageTemplate.update({
        where: { id: current.id },
        data: {
          name: nextName,
          channel: dto.channel ?? current.channel,
          content: nextContent,
          isActive: dto.isActive ?? current.isActive
        }
      });

      if (contentChanged) {
        await tx.messageTemplateVersion.create({
          data: {
            templateId: current.id,
            versionNo: (latestVersion?.versionNo ?? 0) + 1,
            content: nextContent
          }
        });
      }

      return template;
    });

    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: updated.id },
      include: this.templateInclude()
    });

    if (!template) {
      throw new NotFoundException("템플릿을 찾을 수 없습니다.");
    }

    return this.serializeTemplate(template);
  }

  private templateInclude() {
    return {
      versions: {
        orderBy: { versionNo: "desc" as const }
      },
      _count: {
        select: {
          usages: true,
          versions: true
        }
      }
    };
  }

  private serializeTemplate(template: {
    id: string;
    name: string;
    channel: TemplateChannel;
    content: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    versions: Array<{ id: string; versionNo: number; content: string; createdAt: Date }>;
    _count: { usages: number; versions: number };
  }) {
    return {
      id: template.id,
      name: template.name,
      channel: template.channel,
      content: template.content,
      isActive: template.isActive,
      usageCount: template._count.usages,
      versionCount: template._count.versions,
      createdAt: toIso(template.createdAt),
      updatedAt: toIso(template.updatedAt),
      versions: template.versions.map((version) => ({
        id: version.id,
        versionNo: version.versionNo,
        content: version.content,
        createdAt: toIso(version.createdAt)
      }))
    };
  }

  private requireCleanString(value: string | null | undefined, message: string) {
    const trimmed = value?.trim();

    if (!trimmed) {
      throw new BadRequestException(message);
    }

    return trimmed;
  }
}
