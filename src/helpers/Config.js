import { fetchDataWithAuth } from './DataLoader.js';

/**
 * Config is used to load the configuration for the app
 * It is used to load the configuration from the backend
 * If the backend is down, it will load the default configuration
 * If the backend is down and the default configuration is not available, it will throw an error
 * The default configuration is used to initialize the app
 * 
 * Example usage:
 * 
 * import configInstance from './helpers/Config';
 * 
 * then..
 * 
 * For synchronous access (might return null or undefined if not yet initialized):
 * const allSettings = configInstance.settings;
 * const specificSetting = configInstance.settings?.someKey;
 *
 * For guaranteed initialized access:
 * async function someFunction() {
 *   await configInstance.initialize();
 *   const allSettings = await configInstance.getAllSettings();
 *   const specificSetting = await configInstance.getSetting('someKey');
 *   // Use settings...
 * }
 * 
 * Or a better destructure approach:
 * 
 * await configInstance.initialize();
 * const {
 *   SCENE: { WIDTH_PERCENTAGE, HEIGHT_PERCENTAGE },
 *   CAMERA: { FOV, MAX_DISTANCE },
 *   SPHERE: { RADIUS: SPHERE_RADIUS, GRIDS: SPHERE_GRIDS },
 *   POLYGONS: { COLOR: POLYGON_COLOR, SHOW_LABELS} (renaming the const to POLYGON_COLOR to be more descriptive)
 * } = configInstance.settings;
 * 
 * @TODO: Add a complex type and validation for the settings
 * @TODO: Add a method to update a setting
 * @TODO: Add a method to save the configuration to the backend
 */
class Config {
  constructor() {
    if (Config.instance) {
      return Config.instance;
    }

    this._settings = null;
    this._initialized = false;
    this._initializationPromise = null;

    Config.instance = this;
    this.initialize();
  }

  async initialize() {
    if (this._initialized) {
      return;
    }

    if (this._initializationPromise) {
      return this._initializationPromise;
    }

    this._initializationPromise = this.loadConfig();
    await this._initializationPromise;
    this._initialized = true;
  }

  async loadConfig() {
    try {
      const configEndpoint = import.meta.env.VITE_APP_RUST_CONFIG_SERVICE_URL;
      const config = await fetchDataWithAuth(configEndpoint);
      
      if (config) {
        //this._settings = JSON.parse(config);
        this._settings = config;
        console.log("Loaded config from backend:", this._settings);
        if (this._settings) {
          Object.freeze(this._settings);
        }
      } else {
        await this.loadLocalConfig();
      }
    } catch (error) {
      console.error("Error fetching config from backend:", error);
      await this.loadLocalConfig();
    }
  }

  async loadLocalConfig() {
    try {
      const defaultConfig = await import('../assets/globe-settings.json');
      this._settings = defaultConfig.default;
      console.log("Loaded default configuration:", this._settings);
      if (this._settings) {
        Object.freeze(this._settings);
      }
    } catch (error) {
      console.error("Error loading default configuration:", error);
    }
  }

  // Keep getSetting as a public method
  async getSetting(key) {
    if (!this._initialized) {
      console.warn('Config not yet initialized. Initializing now...');
      await this.initialize();
    }
    return this._settings ? this._settings[key] : undefined;
  }

  async getAllSettings() {
    if (!this._settings) {
      console.warn('Config not yet initialized. Initializing now...');
      await this.initialize();
    }
    return this._settings;
  }

  // Make settings read-only and get synchronously
  get settings() {
    if (!this._initialized) {
      console.warn('Config not yet initialized. Initializing now...');
    }
    return this._settings;
  }
}

// Export a singleton instance
const configInstance = new Config();
export default configInstance;