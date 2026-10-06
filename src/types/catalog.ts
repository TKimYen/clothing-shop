export type Season = "SPRING_SUMMER" | "FALL_WINTER";

export const SEASONS: ReadonlyArray<{ value: Season; label: string }> = [
  { value: "SPRING_SUMMER", label: "Spring / Summer" },
  { value: "FALL_WINTER", label: "Fall / Winter" },
];

export function formatSeason(season: string): string {
  return SEASONS.find((row) => row.value === season)?.label ?? season;
}

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  season: Season;
  year: number;
  description: string;
  bannerUrl: string;
  startsAt: string;
  isActive: boolean;
};

export type Size = {
  id: string;
  label: string;
  sortOrder: number;
};

export type Color = {
  id: string;
  name: string;
  hexCode: string;
};

export type CategoryInput = Pick<Category, "name" | "slug">;

export type CollectionInput = Omit<Collection, "id">;

export type SizeInput = Pick<Size, "label" | "sortOrder">;

export type ColorInput = Pick<Color, "name" | "hexCode">;
