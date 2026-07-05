import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AiProvider, IssueType, Urgency } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AiReportInput = {
  location: string;
  description: string;
};

export type AiReportAnalysis = {
  provider: AiProvider;
  model: string;
  summary: string;
  issueType: IssueType;
  urgency: Urgency;
  missingFields: string[];
  vendorDescription: string;
  confidence: number;
  rawOutput: unknown;
};

const issueTypeValues = new Set<string>(Object.values(IssueType));
const urgencyValues = new Set<string>(Object.values(Urgency));

const REQUEST_TIMEOUT_MS = 12_000;

/**
 * 신고 내용을 AI(OpenAI/Gemini)로 구조화한다.
 * 키 미설정·호출 실패·응답 파싱 실패 시 null을 반환하고,
 * 호출부(ReportsService)가 규칙 기반 분류로 폴백한다.
 */
@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async analyzeReport(input: AiReportInput): Promise<AiReportAnalysis | null> {
    const provider = await this.getConfiguredProvider();

    try {
      if (provider === AiProvider.GEMINI) {
        return await this.analyzeWithGemini(input);
      }

      return await this.analyzeWithOpenAi(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI 분석 실패, 규칙 기반으로 폴백합니다: ${message}`);
      return null;
    }
  }

  async getConfiguredProvider(): Promise<AiProvider> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: "ai_provider" },
    });
    const value = String(setting?.value ?? "").toLowerCase();

    return value.includes("gemini") ? AiProvider.GEMINI : AiProvider.OPENAI;
  }

  private buildPrompt(input: AiReportInput) {
    return [
      "당신은 배수 문제(막힘·역류·침수·악취) 신고 접수 분석가입니다.",
      "아래 고객 신고를 분석해 JSON 객체로만 응답하세요. 다른 텍스트는 쓰지 마세요.",
      "",
      `신고 위치: ${input.location}`,
      `증상 설명: ${input.description}`,
      "",
      "JSON 스키마:",
      "{",
      '  "summary": "48자 이내 한 줄 요약",',
      '  "issueType": "FLOOD | DRAIN | SEWER_BACKFLOW | ODOR | EMERGENCY | OTHER",',
      '  "urgency": "NORMAL | URGENT | EMERGENCY",',
      '  "missingFields": ["배정에 부족한 필수 정보의 한글 명칭. 없으면 빈 배열"],',
      '  "vendorDescription": "출동 업체에 전달할 작업 설명 2~4문장 (위치·증상·예상 작업 포함)",',
      '  "confidence": 0.0에서 1.0 사이 숫자',
      "}",
      "",
      "판단 기준: 침수·물이 차오름·영업 중단은 EMERGENCY, 역류·오수·심한 악취는 URGENT, 그 외 NORMAL.",
    ].join("\n");
  }

  private async analyzeWithOpenAi(input: AiReportInput): Promise<AiReportAnalysis> {
    const apiKey = this.config.get<string>("OPENAI_API_KEY")?.trim();
    const model = this.config.get<string>("OPENAI_MODEL")?.trim() || "gpt-4o-mini";

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: this.buildPrompt(input) }],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI 응답 오류 ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI 응답에 내용이 없습니다.");
    }

    return this.parseAnalysis(AiProvider.OPENAI, model, content);
  }

  private async analyzeWithGemini(input: AiReportInput): Promise<AiReportAnalysis> {
    const apiKey = this.config.get<string>("GEMINI_API_KEY")?.trim();
    const model = this.config.get<string>("GEMINI_MODEL")?.trim() || "gemini-2.0-flash";

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: this.buildPrompt(input) }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini 응답 오류 ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Gemini 응답에 내용이 없습니다.");
    }

    return this.parseAnalysis(AiProvider.GEMINI, model, content);
  }

  private parseAnalysis(
    provider: AiProvider,
    model: string,
    content: string,
  ): AiReportAnalysis {
    const parsed = JSON.parse(content) as Record<string, unknown>;

    const summary = this.asText(parsed.summary);
    const vendorDescription = this.asText(parsed.vendorDescription);

    if (!summary || !vendorDescription) {
      throw new Error("AI 응답에 summary/vendorDescription이 없습니다.");
    }

    const issueTypeRaw = String(parsed.issueType ?? "").toUpperCase();
    const urgencyRaw = String(parsed.urgency ?? "").toUpperCase();
    const confidenceRaw = Number(parsed.confidence);
    const missingFields = Array.isArray(parsed.missingFields)
      ? parsed.missingFields
          .filter((field): field is string => typeof field === "string")
          .map((field) => field.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];

    return {
      provider,
      model,
      summary: summary.slice(0, 120),
      issueType: issueTypeValues.has(issueTypeRaw)
        ? (issueTypeRaw as IssueType)
        : IssueType.OTHER,
      urgency: urgencyValues.has(urgencyRaw)
        ? (urgencyRaw as Urgency)
        : Urgency.NORMAL,
      missingFields,
      vendorDescription,
      confidence: Number.isFinite(confidenceRaw)
        ? Math.min(1, Math.max(0, confidenceRaw))
        : 0.5,
      rawOutput: parsed,
    };
  }

  private asText(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
