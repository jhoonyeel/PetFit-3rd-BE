import type {
  MonthlyEntryDto,
  DailyEntryDto,
  RemarkDto,
  RemarkCreateDto,
} from "./types.js"; // 아래 types.ts 참고

export type PetApiResponse = {
  id: number;
  name: string;
  type: string; // '강아지' 등
  gender: string; // '남아' 등
  birthDate: string; // 'YYYY-MM-DD'
  isFavorite: boolean;
  memberId: number;
};

let petSeq = 1;
let remarkSeq = 1;

const pets = new Map<number, PetApiResponse>();
const remarks = new Map<number, RemarkDto & { petId: number }>();

export const db = {
  // pets
  listPetsByMember(memberId: number) {
    return [...pets.values()].filter((p) => p.memberId === memberId);
  },
  getPet(petId: number) {
    return pets.get(petId) ?? null;
  },
  createPet(payload: Omit<PetApiResponse, "id">) {
    const id = petSeq++;
    const pet: PetApiResponse = { id, ...payload };
    pets.set(id, pet);
    return pet;
  },

  // remarks
  listRemarksByPet(petId: number) {
    return [...remarks.values()].filter((r) => r.petId === petId);
  },
  listRemarksByPetAndDate(petId: number, date: string) {
    return [...remarks.values()].filter(
      (r) => r.petId === petId && r.remarkDate === date
    );
  },
  createRemark(petId: number, dto: RemarkCreateDto): RemarkDto {
    const remarkId = remarkSeq++;
    const row: RemarkDto & { petId: number } = {
      petId,
      remarkId,
      title: dto.title,
      content: dto.content,
      remarkDate: dto.remarkDate,
    };
    remarks.set(remarkId, row);
    const { petId: _, ...pure } = row;
    return pure;
  },
  updateRemark(
    remarkId: number,
    patch: { title: string; content: string }
  ): RemarkDto | null {
    const row = remarks.get(remarkId);
    if (!row) return null;
    row.title = patch.title;
    row.content = patch.content;
    remarks.set(remarkId, row);
    const { petId: _, ...pure } = row;
    return pure;
  },
  deleteRemark(remarkId: number) {
    return remarks.delete(remarkId);
  },

  // auth helpers
  isNewUser(memberId: number) {
    return this.listPetsByMember(memberId).length === 0;
  },

  // entries
  monthlyEntries(petId: number, month: string): MonthlyEntryDto[] {
    // month: 'YYYY-MM'
    const monthPrefix = `${month}-`;
    const dates = new Set<string>();
    for (const r of remarks.values()) {
      if (r.petId === petId && r.remarkDate.startsWith(monthPrefix))
        dates.add(r.remarkDate);
    }
    // 날짜별 플래그 생성(remarked만 true, 나머지 false)
    return [...dates].sort().map((d) => ({
      entryDate: d,
      completed: false,
      memo: false,
      remarked: true,
      scheduled: false,
    }));
  },
  dailyEntry(petId: number, date: string): DailyEntryDto {
    return {
      entryDate: date,
      remarkResponseList: this.listRemarksByPetAndDate(petId, date).map((r) => {
        const { petId: _, ...pure } = r;
        return pure;
      }),
      routineResponseList: [],
    };
  },
};
