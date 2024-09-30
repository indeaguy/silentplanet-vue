
/**
 * Use like this:
 * import WorldStageController from './path/to/WorldStage';
 * 
 * and do for example:
 * ...
 * const targetElement = 'your-target-element-id';
 * const worldStage = new WorldStageController(targetElementm configSingleton);
 * ...
 */

import { WorldStageController, getWorldStageController } from './WorldStageController.js';
import { WorldStageModel } from './WorldStageModel.js';
import { WorldStageView } from './WorldStageView.js';

export {
  WorldStageController,
  getWorldStageController,
  WorldStageModel,
  WorldStageView
};

// Default export for convenience
export default WorldStageController;