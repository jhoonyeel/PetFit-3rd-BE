// demo/entrySSOT.ts
import type { DailyEntry, DemoSession, Routine, Slot } from "../types/demo";

// YYYY-MM-DD
export const isYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
// YYYY-MM
export const isYm = (s: string) => /^\d{4}-\d{2}$/.test(s);
export const ymdToYm = (ymd: string) => ymd.slice(0, 7);

export function daysInMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate(); // m is 1..12
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function buildYmd(ym: string, day: number) {
  return `${ym}-${pad2(day)}`;
}

// 데모: 루틴ID 시퀀스(서버 재시작 시 초기화돼도 OK)
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

// ✅ SSOT: entriesByPetId에서 일간 엔트리 보장
export function ensureDailyEntry(
  session: DemoSession,
  petId: number,
  date: string
): DailyEntry {
  session.entriesByPetId ??= {};
  session.entriesByPetId[petId] ??= {};

  const cached = session.entriesByPetId[petId][date];
  if (cached) return cached;

  const slot = session.slotByPetId[petId];
  const routines = slot ? buildRoutinesFromSlot(slot, date) : [];

  const created: DailyEntry = {
    entryDate: date,
    routineResponseList: routines,
    remarkResponseList: [],
  };

  session.entriesByPetId[petId][date] = created;
  return created;
}

// ✅ 월간 조회 시 해당 월 전체 날짜를 미리 ensure
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
