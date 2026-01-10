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
  EXISTING_ENTRY_SEED_MONTHS,
} from "./data";
import { buildRoutinesFromSlot } from "./entrySSOT";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(base: Date, delta: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function addMonths(base: Date, delta: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// "YYYY-MM-DDTHH:mm:ss" (Z 없음)
function toLocalDateTime(dateYmd: string, hhmm: string) {
  const [hh, mm] = hhmm.split(":");
  return `${dateYmd}T${pad2(Number(hh))}:${pad2(Number(mm))}:00`;
}

function isSameYmd(a: string, b: string) {
  return a === b;
}

/**
 * ✅ 날짜별 정책에 맞게 루틴 상태를 만든다.
 * - 오늘: completed=false (CHECKED 만들지 않음)
 * - memo day: 최소 1개 MEMO → completed는 절대 true 불가
 * - completed day: 전부 CHECKED + MEMO 없음
 * - 나머지: 일부만 CHECKED
 */
function applyRoutinePolicy(
  base: Routine[],
  dateYmd: string,
  todayYmd: string
): Routine[] {
  if (base.length === 0) return base;

  const day = Number(dateYmd.slice(8, 10)); // 1..31

  // ✅ 오늘은 completed=false 강제
  if (isSameYmd(dateYmd, todayYmd)) {
    return base.map((r, idx) =>
      idx === 0
        ? { ...r, status: "MEMO", content: "오늘 컨디션 기록", actualAmount: 0 }
        : { ...r, status: "UNCHECKED", content: "", actualAmount: 0 }
    );
  }

  // ✅ remarked는 독립이지만, memo=true 정책을 위해 memo day를 분리
  const isMemoDay = day % 5 === 0; // memo day 규칙(원하면 바꿔도 됨)
  const isCompletedDay = day % 7 === 0; // completed day 규칙(원하면 바꿔도 됨)

  // memo=true → completed=false 보장 (MEMO 1개 강제)
  if (isMemoDay) {
    return base.map((r, idx) =>
      idx === 0
        ? {
            ...r,
            status: "MEMO",
            content: "컨디션이 조금 예민해요",
            actualAmount: 0,
          }
        : { ...r, status: "UNCHECKED", content: "", actualAmount: 0 }
    );
  }

  // completed=true (전부 CHECKED, MEMO 없음)
  if (isCompletedDay) {
    return base.map((r) => ({
      ...r,
      status: "CHECKED",
      content: "",
      actualAmount: r.targetAmount,
    }));
  }

  // 그 외: 일부만 체크
  return base.map((r, idx) =>
    idx === 0
      ? { ...r, status: "CHECKED", content: "", actualAmount: r.targetAmount }
      : { ...r, status: "UNCHECKED", content: "", actualAmount: 0 }
  );
}

/**
 * remarked는 독립: 특정 날에만 넣기(추후 CRUD로 바뀔 수 있음)
 */
function buildRemarks(dateYmd: string): Remark[] {
  const day = Number(dateYmd.slice(8, 10));
  if (day % 6 !== 0) return [];
  return [
    {
      remarkId: Number(dateYmd.replace(/-/g, "")),
      title: "특이사항",
      content: "식욕이 평소보다 낮아 관찰 필요",
      remarkDate: dateYmd,
    },
  ];
}

export function seedExistingScenario(session: DemoSession, petIds: number[]) {
  // 1) 슬롯 seed
  for (const petId of petIds) {
    session.slotByPetId[petId] = DEFAULT_EXISTING_SLOT;
  }

  // 2) 알람 seed (오늘 날짜 기준)
  session.alarmsByPetId ??= {};
  const today = startOfDay(new Date());
  const todayYmd = toYmd(today);

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

  // 3) ✅ 엔트리 seed: “최근 N개월 모든 날짜” 생성 (필수)
  session.entriesByPetId ??= {};

  // 시작일: 오늘 기준 N개월 전 “해당 월의 1일”로 끊고 싶으면 setDate(1) 추가 가능
  const start = startOfDay(addMonths(today, -EXISTING_ENTRY_SEED_MONTHS));
  const end = today; // 오늘 포함

  for (const petId of petIds) {
    session.entriesByPetId[petId] ??= {};

    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const dateYmd = toYmd(d);

      // slot이 있으면 base 루틴 생성(없으면 [])
      const slot = session.slotByPetId[petId];
      const base: Routine[] = slot ? buildRoutinesFromSlot(slot, dateYmd) : [];

      const routines = applyRoutinePolicy(base, dateYmd, todayYmd);
      const remarks = buildRemarks(dateYmd);

      const entry: DailyEntry = {
        entryDate: dateYmd,
        routineResponseList: routines,
        remarkResponseList: remarks,
      };

      session.entriesByPetId[petId][dateYmd] = entry;
    }
  }
}
