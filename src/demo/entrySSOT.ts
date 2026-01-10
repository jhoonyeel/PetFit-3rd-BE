// demo/entrySSOT.ts
import type { DailyEntry, DemoSession, Routine, Slot } from "../types/demo";

// YYYY-MM-DD
export const isYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
// YYYY-MM
export const isYm = (s: string) => /^\d{4}-\d{2}$/.test(s);
export const ymdToYm = (ymd: string) => ymd.slice(0, 7);

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toTodayYmd() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toYmd(d);
}

export function getRecentYmdSet(days: number) {
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

export function extractYmdFromLocalDateTime(s: string) {
  // "YYYY-MM-DDTHH:mm:ss" -> "YYYY-MM-DD"
  return typeof s === "string" && s.length >= 10 ? s.slice(0, 10) : "";
}

export function daysInMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function buildYmd(ym: string, day: number) {
  return `${ym}-${pad2(day)}`;
}

// demo: 루틴ID 시퀀스
let routineSeq = 1000;

export function buildRoutinesFromSlot(slot: Slot, date: string): Routine[] {
  const routines: Routine[] = [];

  if (slot.feedActivated) {
    routines.push({
      routineId: routineSeq++,
      category: "feed",
      status: "UNCHECKED",
      targetAmount: slot.feedAmount,
      actualAmount: 0,
      content: "",
      date,
    });
  }

  if (slot.waterActivated) {
    routines.push({
      routineId: routineSeq++,
      category: "water",
      status: "UNCHECKED",
      targetAmount: slot.waterAmount,
      actualAmount: 0,
      content: "",
      date,
    });
  }

  if (slot.walkActivated) {
    routines.push({
      routineId: routineSeq++,
      category: "walk",
      status: "UNCHECKED",
      targetAmount: slot.walkAmount,
      actualAmount: 0,
      content: "",
      date,
    });
  }

  if (slot.pottyActivated) {
    routines.push({
      routineId: routineSeq++,
      category: "potty",
      status: "UNCHECKED",
      targetAmount: 0,
      actualAmount: 0,
      content: "",
      date,
    });
  }

  if (slot.dentalActivated) {
    routines.push({
      routineId: routineSeq++,
      category: "dental",
      status: "UNCHECKED",
      targetAmount: 0,
      actualAmount: 0,
      content: "",
      date,
    });
  }

  if (slot.skinActivated) {
    routines.push({
      routineId: routineSeq++,
      category: "skin",
      status: "UNCHECKED",
      targetAmount: 0,
      actualAmount: 0,
      content: "",
      date,
    });
  }

  return routines;
}

/**
 * ✅ 정책 반영:
 * - entry 없으면 생성
 * - entry는 있는데 "slot 변경"이 발생한 경우: 오늘 routines를 slot 기준으로 강제 덮어쓰기
 * - remark는 독립 → 유지
 */
export function ensureDailyEntry(
  session: DemoSession,
  petId: number,
  date: string,
  opts?: { forceRebuildRoutines?: boolean }
): DailyEntry {
  session.entriesByPetId ??= {};
  session.entriesByPetId[petId] ??= {};

  const cached = session.entriesByPetId[petId][date];
  const slot = session.slotByPetId[petId];

  // ✅ 캐시가 있으면: 필요 시 routines만 재생성
  if (cached) {
    const force = opts?.forceRebuildRoutines === true;

    // slot이 생겼거나 바뀐 경우: 당일 루틴 초기화(덮어쓰기)
    if (slot && force) {
      cached.routineResponseList = buildRoutinesFromSlot(slot, date);
      // cached.remarkResponseList는 유지
    }

    // slot이 있는데 routines가 비어있는 “구형 상태”도 보정
    if (slot && cached.routineResponseList.length === 0) {
      cached.routineResponseList = buildRoutinesFromSlot(slot, date);
    }

    return cached;
  }

  // ✅ 캐시 없으면 신규 생성
  const created: DailyEntry = {
    entryDate: date,
    routineResponseList: slot ? buildRoutinesFromSlot(slot, date) : [],
    remarkResponseList: [],
  };

  session.entriesByPetId[petId][date] = created;
  return created;
}

export function ensureMonthEntries(
  session: DemoSession,
  petId: number,
  ym: string
) {
  const maxDay = daysInMonth(ym);
  for (let d = 1; d <= maxDay; d++) {
    ensureDailyEntry(session, petId, buildYmd(ym, d));
  }
}
