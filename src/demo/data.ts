import type { Pet, Slot } from "../types/demo";

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
