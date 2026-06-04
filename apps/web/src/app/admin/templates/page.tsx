import { AdminShell } from "@/components/admin-shell";
import { getMessageTemplates } from "@/lib/admin-api";
import { formatDateTime, labelOf, templateChannelLabels } from "@/lib/labels";
import { createMessageTemplateAction, updateMessageTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

const channelOptions = ["WEB", "SMS", "KAKAO", "AI_CALL"];
const templateHints = [
  "{{customer_phone}}",
  "{{issue_summary}}",
  "{{company_name}}",
  "{{estimated_price}}",
  "{{available_time}}"
];

export default async function AdminTemplatesPage() {
  const templates = await getMessageTemplates();

  return (
    <AdminShell>
      <header className="workspace-header">
        <p className="eyebrow">메시지</p>
        <h1>템플릿 관리</h1>
      </header>

      <section className="panel-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">새 템플릿</p>
            <h2>배정 안내 문구 생성</h2>
          </div>
        </div>
        <form action={createMessageTemplateAction} className="admin-form">
          <div className="form-grid">
            <label className="form-field">
              <span>이름</span>
              <input name="name" placeholder="업체 배정 안내" required />
            </label>
            <label className="form-field">
              <span>채널</span>
              <select name="channel" defaultValue="WEB">
                {channelOptions.map((channel) => (
                  <option key={channel} value={channel}>
                    {labelOf(templateChannelLabels, channel)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="form-field textarea-field">
            <span>내용</span>
            <textarea
              name="content"
              placeholder="{{customer_phone}} 고객님, {{issue_summary}} 신고에 {{company_name}} 업체가 배정되었습니다."
              required
            />
          </label>
          <label className="checkbox-field">
            <input defaultChecked name="isActive" type="checkbox" />
            <span>활성화</span>
          </label>
          <div className="tag-row">
            {templateHints.map((hint) => (
              <span key={hint}>{hint}</span>
            ))}
          </div>
          <div className="action-row">
            <button className="primary-button" type="submit">
              템플릿 생성
            </button>
          </div>
        </form>
      </section>

      <section className="template-grid">
        {templates.map((template) => {
          const updateTemplate = updateMessageTemplateAction.bind(null, template.id);

          return (
            <article className="template-card" key={template.id}>
              <form action={updateTemplate} className="admin-form compact-form">
                <div className="form-grid">
                  <label className="form-field">
                    <span>이름</span>
                    <input name="name" defaultValue={template.name} required />
                  </label>
                  <label className="form-field">
                    <span>채널</span>
                    <select name="channel" defaultValue={template.channel}>
                      {channelOptions.map((channel) => (
                        <option key={channel} value={channel}>
                          {labelOf(templateChannelLabels, channel)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="form-field textarea-field">
                  <span>내용</span>
                  <textarea name="content" defaultValue={template.content} required />
                </label>
                <div className="template-meta-row">
                  <label className="checkbox-field">
                    <input defaultChecked={template.isActive} name="isActive" type="checkbox" />
                    <span>활성화</span>
                  </label>
                  <span>{template.usageCount}회 사용</span>
                  <span>v{template.versionCount}</span>
                  <span>{formatDateTime(template.updatedAt)}</span>
                </div>
                <div className="action-row">
                  <button className="secondary-button" type="submit">
                    수정 저장
                  </button>
                </div>
              </form>

              <div className="template-version-list">
                {template.versions.map((version) => (
                  <div className="template-version-entry" key={version.id}>
                    <strong>v{version.versionNo}</strong>
                    <span>{formatDateTime(version.createdAt)}</span>
                    <p>{version.content}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
        {templates.length === 0 ? <p className="empty-text">등록된 템플릿이 없습니다.</p> : null}
      </section>
    </AdminShell>
  );
}
