// Portfolio 2030 - 3D world config. All units are meters.

export const WORLD_RADIUS = 180;          // island radius
export const TERRAIN_SIZE = 420;          // terrain plane edge
export const TERRAIN_SEGMENTS = 160;      // heightmap resolution
export const WATER_LEVEL = -1.2;

export const CAMERA_FOV_BASE = 62;
export const CAMERA_FOV_SPRINT = 70;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 600;
export const CAMERA_DISTANCE = 5.2;
export const CAMERA_HEIGHT = 2.35;
export const CAMERA_SHOULDER = 0.55;

export const WALK_SPEED = 4.0;
export const SPRINT_SPEED = 7.8;
export const TURN_LERP = 14.0;
export const MOVE_ACCEL = 18.0;
export const MOVE_DECEL = 22.0;

export const SHADOW_MAP_SIZE_DESKTOP = 2048;
export const SHADOW_MAP_SIZE_MOBILE = 1024;
export const SHADOW_FRUSTUM_SIZE = 55;

export const FOG_COLOR_DAY = 0xbcd4ea;
export const FOG_COLOR_DUSK = 0xe8a77c;
export const FOG_COLOR_NIGHT = 0x0d1a2e;
export const FOG_DENSITY = 0.0085;

export const SKY_TOP_DAY = 0x6fb7ff;
export const SKY_MID_DAY = 0xbcd4ea;
export const SKY_BOTTOM_DAY = 0xf0e2c4;

export const SKY_TOP_DUSK = 0x30274e;
export const SKY_MID_DUSK = 0xd47a4c;
export const SKY_BOTTOM_DUSK = 0xffcb88;

export const SKY_TOP_NIGHT = 0x05081a;
export const SKY_MID_NIGHT = 0x0e1834;
export const SKY_BOTTOM_NIGHT = 0x2a3357;

export const PALETTE = {
  grass:        0x6fa04a,
  grassDark:    0x4f7a33,
  sand:         0xe6c887,
  sandDark:     0xb89a5a,
  stone:        0x8a8e95,
  stoneDark:    0x4a4e56,
  wood:         0x7a5a38,
  woodDark:     0x4a3420,
  water:        0x2a5f8a,
  waterDeep:    0x0f2a44,
  pathLight:    0xc9a577,
  pathDark:     0x88663d,
  leafLight:    0x7cb84a,
  leafDark:     0x3e6b24,
  accentBlue:   0x7cc7ff,
  accentViolet: 0xb48cff,
  accentGold:   0xf4c64e,
  accentOrange: 0xff8a55,
  accentRed:    0xe55a5a,
  accentGreen:  0x5ee0a0
};

export const RESUME_HREF = './Kaviyarasu Full Stack Engineer Resume.pdf';
export const TYPE_CPS = 120;

export const INTERACT_RADIUS_DEFAULT = 4.2;
export const DIALOGUE_CLOSE_RADIUS_PADDING = 2.0;
