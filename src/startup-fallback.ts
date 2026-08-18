// Dependency-free startup diagnostics so a JavaScript bootstrap failure never
// presents as an unexplained blank screen.
export function installStartupFallback() {
  const root = document.getElementById('root');
  if (!root) return;
  const escape = (value: string) => value.replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c] || c));
  const showError = (message: string) => {
    root.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a"><section style="width:min(520px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 8px 30px rgba(15,23,42,.08)"><h1 style="margin:0 0 8px;font-size:22px">ร้านกลางนาโซล่าเซลล์</h1><p style="margin:0 0 16px;color:#475569">ระบบเริ่มต้นไม่สำเร็จ กรุณาลองโหลดหน้าใหม่</p><button onclick="location.reload()" style="border:0;border-radius:10px;padding:12px 18px;background:#0f172a;color:#fff;font-weight:600">โหลดใหม่</button><details style="margin-top:16px"><summary>รายละเอียด</summary><pre style="white-space:pre-wrap;font-size:12px;color:#64748b">${escape(message)}</pre></details></section></main>`;
  };
  window.addEventListener('error', (event) => {
    if (event.error) showError(event.error.message || 'JavaScript startup error');
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    showError(`Unhandled promise rejection: ${reason}`);
  });
}
