export interface Translator {
  id: string;
  shortName: string;
  name: string;
  modTool?: string;
  link?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface SystemMaster {
  id: string;
  shortName: string;
  name: string;
}

export interface Patch {
  id: string;
  updateDate: string;
  fileName: string;
  gameTitle: string;
  system: string;
  translatorId: string;
  translatedBy: string;
  patchTool: string;
  tags: string[];
  coverUrl: string;
  patchFileUrl: string;
  haveRom: boolean;
  patchedRomUrl: string;
  referenceText: string;
  referenceUrl: string;
}

export interface AdminProfile {
  uid: string;
  email: string;
}

export interface PatchDraft {
  updateDate: string;
  fileName: string;
  gameTitle: string;
  system: string;
  translatorId: string;
  patchTool: string;
  tags: string[];
  patchFileUrl: string;
  haveRom: boolean;
  patchedRomUrl: string;
  referenceText: string;
  referenceUrl: string;
  coverFile?: File;
}

export interface ProcessedCover {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

export type GameListSortField = 'gameTitle' | 'translatedBy' | 'system' | 'updateDate';
export type SortDirection = 'asc' | 'desc';

export interface GameListFilters {
  keyword: string;
  tag: string | null;
  translatorId: string | null;
  system: string | null;
  sortBy: GameListSortField;
  sortDirection: SortDirection;
}
