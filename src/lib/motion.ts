export const EASE_OUT = [0.22, 1, 0.32, 1] as const;
export const EASE_SINE = [0.45, 0, 0.55, 1] as const;
export const DURATION = 0.42;
export const STAGGER = 0.08;
export const RISE = 16;
export const CAN_TRAVEL = 12;

// Cinematic entrance (hero, once-ever choreography) — slower, more theatrical
// than the site's everyday interaction timing above. Same curve measured off
// racing.porsche.com's own hero reveal (Bezier(0.16,1,0.3,1) @ ~700ms).
export const EASE_CINEMA = [0.16, 1, 0.3, 1] as const;
export const DURATION_CINEMA = 0.7;
export const STAGGER_CINEMA = 0.15;
