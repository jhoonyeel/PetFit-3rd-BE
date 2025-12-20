export interface MonthlyEntryDto {
  entryDate: string;
  completed: boolean;
  memo: boolean;
  remarked: boolean;
  scheduled: boolean;
}
export interface DailyEntryDto {
  entryDate: string;
  remarkResponseList: RemarkDto[];
  routineResponseList: any[];
}
export interface RemarkDto {
  remarkId: number;
  title: string;
  content: string;
  remarkDate: string;
}
export interface RemarkCreateDto {
  title: string;
  content: string;
  remarkDate: string;
}
export type RemarkUpdateDto = Pick<RemarkCreateDto, "title" | "content">;
