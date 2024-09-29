export interface WorldStageConfig {
  SCENE: {
    WIDTH_PERCENTAGE: number;
    HEIGHT_PERCENTAGE: number;
    [key: string]: any; // Allow additional properties in SCENE
  };
  CAMERA: {
    FOV: number;
    MIN_VISIBLE_DISTANCE: number;
    MAX_VISIBLE_DISTANCE: number;
    DEFAULT_POINT_X: number;
    DEFAULT_POINT_Y: number;
    DEFAULT_POINT_Z: number;
    MAX_ZOOM_DISTANCE: number;
    MIN_ZOOM_DISTANCE: number;
    [key: string]: any; // Allow additional properties in CAMERA
  };
  [key: string]: any; // Allow additional top-level properties
}