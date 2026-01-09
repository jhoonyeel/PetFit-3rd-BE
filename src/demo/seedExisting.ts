// demo/seedExisting.ts
import type {
  DemoSession,
  DailyEntry,
  Routine,
  Alarm,
  Remark,
} from "../types/demo";
import {
  DEFAULT_EXISTING_SLOT,
  EXISTING_ALARM_TEMPLATES,
  EXISTING_ENTRY_SEED_DAYS,
  EXISTING_ENTRY_SEED_MONTHS,
} from "./data";
import { buildRoutinesFromSlot } from "./entrySSOT";

const isYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYm(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function buildYmd(ym: string, day: number) {
  return `${ym}-${pad2(day)}`;
}

function getRecentMonths(count: number) {
  const base = new Date();
  base.setDate(1);

  const months: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    months.push(toYm(d));
  }
  return months;
}

// "YYYY-MM-DDTHH:mm:ss" (Z 없음)
function toLocalDateTime(dateYmd: string, hhmm: string) {
  const [hh, mm] = hhmm.split(":");
  return `${dateYmd}T${pad2(Number(hh))}:${pad2(Number(mm))}:00`;
}

// routine status 다양화
function varyRoutines(routines: Routine[], day: number): Routine[] {
  if (routines.length === 0) return routines;

  if (day % 7 === 0) {
    return routines.map(
      (r) =>
        ({
          ...r,
          status: "CHECKED",
          actualAmount: r.targetAmount,
          content: "",
        } satisfies Routine)
    );
  }

  if (day % 5 === 0) {
    const [first, ...rest] = routines;
    return [
      {
        ...first,
        status: "MEMO",
        content: "컨디션이 조금 예민해요",
        actualAmount: Number.isFinite(first.actualAmount)
          ? first.actualAmount
          : 0,
      } satisfies Routine,
      ...rest,
    ];
  }

  return routines.map((r, idx) =>
    idx === 0
      ? ({
          ...r,
          status: "CHECKED",
          actualAmount: r.targetAmount,
        } satisfies Routine)
      : r
  );
}

function maybeRemarks(day: number, date: string): Remark[] {
  if (day % 6 !== 0) return [];
  return [
    {
      remarkId: Number(date.replace(/-/g, "")),
      title: "특이사항",
      content: "식욕이 평소보다 낮아 관찰 필요",
      remarkDate: date,
    } satisfies Remark,
  ];
}

export function seedExistingScenario(session: DemoSession, petIds: number[]) {
  // 1) 슬롯 seed
  for (const petId of petIds) {
    session.slotByPetId[petId] = DEFAULT_EXISTING_SLOT;
  }

  // 2) 알람 seed
  session.alarmsByPetId ??= {};
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(
    today.getDate()
  )}`;

  for (const petId of petIds) {
    const alarms: Alarm[] = EXISTING_ALARM_TEMPLATES.map((t, idx) => ({
      alarmId: petId * 10 + (idx + 1),
      title: t.title,
      content: t.content,
      targetDateTime: toLocalDateTime(todayYmd, t.hhmm),
      read: t.read,
    }));

    session.alarmsByPetId[petId] = alarms;
  }

  // 3) 엔트리 seed (최근 N개월, 일부 날짜만)
  session.entriesByPetId ??= {};
  const months = getRecentMonths(EXISTING_ENTRY_SEED_MONTHS);
  const seedDays = [...EXISTING_ENTRY_SEED_DAYS];

  for (const petId of petIds) {
    session.entriesByPetId[petId] ??= {};

    for (const ym of months) {
      for (const day of seedDays) {
        const date = buildYmd(ym, day);
        if (!isYmd(date)) continue;

        const slot = session.slotByPetId[petId];
        const base: Routine[] = slot ? buildRoutinesFromSlot(slot, date) : [];

        const routines: Routine[] = varyRoutines(base, day);
        const remarks: Remark[] = maybeRemarks(day, date);

        const entry = {
          entryDate: date,
          routineResponseList: routines,
          remarkResponseList: remarks,
        } satisfies DailyEntry;

        session.entriesByPetId[petId][date] = entry;
      }
    }
  }
}
