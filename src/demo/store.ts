import type { DemoSession, DemoSessionScenario } from "../types/demo";
import { DEMO_PETS_BY_MEMBER } from "./data";

/* Demo Session Store (in-memory) */
const demoSessions: Record<number, DemoSession> = {};

export function ensureSession(memberId: number) {
  if (demoSessions[memberId]) return;
  // 서버 재시작 등으로 세션이 날아간 경우 기본 복구
  const scenario: DemoSessionScenario = memberId === 2 ? "existing" : "new";
  initDemoSession(memberId, scenario);
}

export function initDemoSession(
  memberId: number,
  scenario: DemoSessionScenario
) {
  if (scenario === "existing") {
    demoSessions[memberId] = {
      scenario,
      onboarding: { petDone: true, routineDone: true },
      slotByPetId: {},
    };
    return;
  }

  demoSessions[memberId] = {
    scenario,
    onboarding: { petDone: false, routineDone: false },
    pet: undefined,
    slotByPetId: {},
  };
}

export function resolveMemberIdByScenario(s?: DemoSessionScenario) {
  // 데모는 시나리오에 따라 고정 memberId 부여 (기존 구조 유지)
  // - new: 1
  // - existing: 2
  return s === "existing" ? 2 : 1;
}

export function getSession(memberId: number) {
  ensureSession(memberId);
  return demoSessions[memberId];
}

export function getExistingSelectedPetId() {
  return (
    DEMO_PETS_BY_MEMBER[2]
      ?.slice()
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))[0]?.id ??
    null
  );
}
