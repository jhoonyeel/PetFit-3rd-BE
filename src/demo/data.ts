import type { Pet, Slot } from "../types/demo";

/** existing 유저가 가진 pets (memberId=2) */
export const DEMO_PETS_BY_MEMBER: Record<number, Pet[]> = {
  2: [
    {
      id: 201,
      name: "콩이",
      type: "강아지",
      gender: "남아",
      birthDate: "2021-03-01",
      isFavorite: true,
    },
    {
      id: 202,
      name: "보리",
      type: "강아지",
      gender: "여아",
      birthDate: "2020-10-12",
      isFavorite: false,
    },
  ],
};

export const DEFAULT_NEW_SLOT: Slot = {
  feedActivated: true,
  waterActivated: true,
  walkActivated: false,
  pottyActivated: true,
  dentalActivated: false,
  skinActivated: false,
  feedAmount: 150,
  waterAmount: 120,
  walkAmount: 0,
};

export const DEFAULT_EXISTING_SLOT: Slot = {
  feedActivated: false,
  waterActivated: true,
  walkActivated: true,
  pottyActivated: true,
  dentalActivated: false,
  skinActivated: false,
  feedAmount: 0,
  waterAmount: 120,
  walkAmount: 2,
};

/** ✅ existing 시나리오에서 "항상 보일" 알람 템플릿 (시간만 고정, 날짜는 seed에서 오늘로 맞춤) */
export const EXISTING_ALARM_TEMPLATES = [
  { title: "산책", content: "산책 준비!", hhmm: "07:30", read: false },
  { title: "물", content: "물 갈아주기", hhmm: "12:00", read: true },
  { title: "배변", content: "배변 상태 체크", hhmm: "21:30", read: false },
] as const;

/** ✅ existing 시나리오에서 "점이 보이는 정도"로 찍을 날짜들(월별) */
export const EXISTING_ENTRY_SEED_DAYS = [3, 8, 15, 22, 28] as const;

/** ✅ existing 시나리오: 몇 개월치 시드할지 */
export const EXISTING_ENTRY_SEED_MONTHS = 3;
