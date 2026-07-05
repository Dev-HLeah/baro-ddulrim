import { AdminShell } from "@/components/admin-shell";
import { getAppSettings } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/labels";
import { updateSettingAction } from "./actions";

export const dynamic = "force-dynamic";

const settingDefinitions = [
  {
    key: "ai_provider",
    title: "AI 제공자",
    description: "신고 내용을 구조화할 AI 제공자를 선택합니다.",
    options: [
      { label: "OpenAI", value: "openai" },
      { label: "Gemini", value: "gemini" }
    ]
  },
  {
    key: "map_provider",
    title: "지도 Provider",
    description: "주소 검색과 지도 표시의 기본 Provider입니다.",
    options: [
      { label: "Kakao", value: "kakao" },
      { label: "Naver", value: "naver" }
    ]
  }
];

function settingValue(settings: Awaited<ReturnType<typeof getAppSettings>>, key: string) {
  const value = settings.find((setting) => setting.key === key)?.value;

  return typeof value === "string" ? value : "";
}

function settingUpdatedAt(settings: Awaited<ReturnType<typeof getAppSettings>>, key: string) {
  return settings.find((setting) => setting.key === key)?.updatedAt ?? null;
}

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return (
    <AdminShell>
      <header className="workspace-header">
        <p className="eyebrow">운영</p>
        <h1>설정</h1>
      </header>

      <section className="settings-grid">
        {settingDefinitions.map((definition) => {
          const updateSetting = updateSettingAction.bind(null, definition.key);

          return (
            <article className="settings-card" key={definition.key}>
              <div>
                <p className="eyebrow">{definition.key}</p>
                <h2>{definition.title}</h2>
                <p>{definition.description}</p>
              </div>
              <form action={updateSetting} className="admin-form compact-form">
                <label className="form-field">
                  <span>값</span>
                  <select name="value" defaultValue={settingValue(settings, definition.key)}>
                    {definition.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="template-meta-row">
                  <span>최근 변경 {formatDateTime(settingUpdatedAt(settings, definition.key))}</span>
                </div>
                <div className="action-row">
                  <button className="secondary-button" type="submit">
                    저장
                  </button>
                </div>
              </form>
            </article>
          );
        })}
      </section>
    </AdminShell>
  );
}
