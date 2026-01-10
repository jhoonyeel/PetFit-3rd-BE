export type DemoSessionScenario = "new" | "existing";
export type DemoLoginBody = { scenario?: DemoSessionScenario };

export type AccessPayload = { memberId: number };
export type RefreshPayload = { memberId: number };

export const PET_TYPE = [
  "강아지",
  "고양이",
  "햄스터",
  "조류",
  "어류",
  "파충류",
] as const;
export type PetType = (typeof PET_TYPE)[number];

export const PET_GENDER = ["남아", "여아", "중성"] as const;
export type PetGender = (typeof PET_GENDER)[number];

export type Pet = {
  id: number;
  name: string;
  type: PetType;
  gender: PetGender;
  birthDate: string; // YYYY-MM-DD
  isFavorite: boolean;
};

export type Slot = {
  feedActivated: boolean;
  waterActivated: boolean;
  walkActivated: boolean;
  pottyActivated: boolean;
  dentalActivated: boolean;
  skinActivated: boolean;
  feedAmount: number;
  waterAmount: number;
  walkAmount: number;
};

export type DemoSession = {
  scenario: DemoSessionScenario;
  onboarding: { petDone: boolean; routineDone: boolean };
  pet?: Pet;
  // petId -> slot
  slotByPetId: Record<number, Slot | undefined>;
  // petId -> date -> entry snapshot (Routine, Remark)
  entriesByPetId: Record<number, Record<string, DailyEntry | undefined>>;
  // petId -> alarms
  alarmsByPetId: Record<number, Alarm[] | undefined>;
};

export const ROUTINE_CATEGORY = [
  "feed",
  "water",
  "walk",
  "potty",
  "dental",
  "skin",
] as const;
export type RoutineCategory = (typeof ROUTINE_CATEGORY)[number];

export const ROUTINE_STATUS = ["CHECKED", "MEMO", "UNCHECKED"] as const;
export type RoutineStatus = (typeof ROUTINE_STATUS)[number];

export type Routine = {
  routineId: number;
  category: RoutineCategory;
  status: RoutineStatus;
  targetAmount: number;
  actualAmount: number;
  content: string;
  date: string; // YYYY-MM-DD
};

export type Remark = {
  remarkId: number;
  title: string;
  content: string;
  remarkDate: string; // YYYY-MM-DD
};

export type DailyEntry = {
  entryDate: string;
  routineResponseList: Routine[];
  remarkResponseList: Remark[];
};

export type MonthlyEntry = {
  entryDate: string; // YYYY-MM-DD
  completed: boolean; // 루틴 완료 여부
  memo: boolean; // 메모 존재 여부
  remarked: boolean; // 특이사항 존재 여부
};

export type Alarm = {
  alarmId: number;
  title: string;
  content: string;
  targetDateTime: string; // "YYYY-MM-DDTHH:mm:ss"
  read: boolean;
};
