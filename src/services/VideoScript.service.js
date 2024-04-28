// src/services/VideoScript.service.js
import GPTService from './GPT.service.js';
import CustomError from '../utils/CustomError';

/**
 * Service to generate video scripts using GPT
 */
class VideoScriptService {
  constructor() {
    this.gptService = new GPTService(); // GPT service instance
  }

  /**
   * Generates a video script using GPT based on user data
   * @param {Object} userData - User data for script generation
   * @returns {Promise<string>} - The generated script
   * @throws {CustomError} - If an error occurs during script generation
   */
  async generateVideoScript(content) {
    try {
      // Create a prompt based on user data
      const prompt = `Create a video script based on: ${content}`;

      // Use GPT service to generate the script
      const script = await this.gptService.processPrompt(prompt);

      return script;
    } catch (error) {
      throw new CustomError('Script generation error', 500);
    }
  }
}

export default VideoScriptService;
