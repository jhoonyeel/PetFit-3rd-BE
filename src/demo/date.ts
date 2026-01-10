function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getRecentYmdSet(days: number) {
  // days=3 => 오늘/어제/그제
  const set = new Set<string>();
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    set.add(toYmd(d));
  }
  return set;
}

function extractYmdFromLocalDateTime(s: string) {
  // "YYYY-MM-DDTHH:mm:ss" -> "YYYY-MM-DD"
  // 형식이 다르면 그냥 앞 10자만 잘라서 비교 (데모 정책)
  return typeof s === "string" && s.length >= 10 ? s.slice(0, 10) : "";
}
