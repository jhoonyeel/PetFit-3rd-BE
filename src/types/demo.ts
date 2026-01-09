export type DemoSessionScenario = "new" | "existing";
export type DemoLoginBody = { scenario?: DemoSessionScenario };

export type AccessPayload = { memberId: number };
export type RefreshPayload = { memberId: number };

export type Pet = {
  id: number;
  name: string;
  type: "강아지" | "고양이" | "햄스터" | "조류" | "어류" | "파충류";
  gender: "남아" | "여아" | "중성";
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
  slotByPetId: Record<number, Slot | undefined>;
  routinesByPetId?: Record<Pet["id"], Record<string, Routine[] | undefined>>;
};

export type Routine = {
  routineId: number;
  category: "feed" | "water" | "walk" | "potty" | "dental" | "skin";
  status: "CHECKED" | "MEMO" | "UNCHECKED";
  targetAmount: number;
  actualAmount: number;
  content: string;
  date: string; // YYYY-MM-DD
};
