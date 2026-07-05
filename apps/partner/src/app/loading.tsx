export default function Loading() {
  return (
    <div className="loading-screen" aria-label="로딩 중">
      <span className="spinner" aria-hidden="true" />
      <p>잠시만 기다려주세요...</p>
    </div>
  );
}
