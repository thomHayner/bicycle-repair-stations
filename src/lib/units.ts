export type Unit = "mi" | "km";

export const KM_PER_MILE = 1.60934;

export const MI_OPTIONS = [1, 2, 5, 10, 15, 20, 25] as const;
export const KM_OPTIONS = [1, 2, 5, 10, 20, 30, 40] as const;

export const MI_OPTIONS_ALL = [1, 2, 5, 10, 15, 20, 25, 50, 100, 250] as const;
export const KM_OPTIONS_ALL = [1, 2, 5, 10, 20, 30, 40, 75, 150, 400] as const;
