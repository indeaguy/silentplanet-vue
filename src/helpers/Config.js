import redis from 'redis';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import path from 'path';

// Load environment variables from .env file if present
dotenv.config();

const redisUrl = process.env.REDIS_URL;

// Configure the Redis client
const redisClient = redis.createClient({
  url: 'redis://localhost:6379' // Replace with your Redis connection details
});

await redisClient.connect();

class Config {
  constructor() {
    if (Config.instance) {
      return Config.instance;
    }

    this.settings = {};

    Config.instance = this;
  }

  // Method to load configuration from Redis or fallback to a local JSON file
  async loadConfig() {
    try {
      // Try fetching the configuration from Redis
      const redisConfig = await redisClient.get('appConfig');
      if (redisConfig) {
        this.settings = JSON.parse(redisConfig);
        console.log("Loaded config from Redis:", this.settings);
      } else {
        // Fallback to loading the local JSON config if Redis is empty
        await this.loadLocalConfig();
        console.log("Falling back to local config:", this.settings);
      }
    } catch (error) {
      console.error("Error fetching config from Redis:", error);
      // If there’s any error, load from the local JSON file
      await this.loadLocalConfig();
    }
  }

  // Method to load the local JSON config file
  async loadLocalConfig() {
    try {
      const filePath = path.resolve('config.json'); // Path to your config.json file
      const fileData = await readFile(filePath, 'utf8');
      this.settings = JSON.parse(fileData);
    } catch (error) {
      console.error("Error reading local config file:", error);
    }
  }

  // Method to update a setting in the config
  updateSetting(key, value) {
    this.settings[key] = value;
    // Optionally, you can update Redis with the new settings as well
    redisClient.set('appConfig', JSON.stringify(this.settings));
  }

  // Method to get a setting from the config
  getSetting(key) {
    return this.settings[key];
  }
}

// Export a singleton instance
const configInstance = new Config();
Object.freeze(configInstance);
export default configInstance;