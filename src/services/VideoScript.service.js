// src/services/VideoScriptService.js
import GPTService from './GPT.service';
import CustomError from '../utils/CustomError';

class VideoScriptService {
  constructor() {
    // Initialize the GPT service
    this.gptService = new GPTService();
  }

  /**
   * Generate a new video script based on a reference script and new content
   * @param {string} refScript - The reference script for style and tone
   * @param {string} content - The new content to incorporate into the script
   * @returns {Promise<string>} - The generated video script
   * @throws {CustomError} - If an error occurs during script generation
   */
  async generateVideoScript(refScript, content) {
    if (!refScript || !content) {
      throw new CustomError('Reference script and content are required', 400);
    }

    // Create the prompt template for GPT
    const prompt = `
You are a scriptwriter. You need to create a new video script based on a reference script and new content. Use the style and tone from the reference script to create a new script with the provided content.

Reference script:
${refScript}

Content:
${content}

Write a video script with this format and tone.
    `;

    try {
      // Send the prompt to the GPT service
      const videoScript = await this.gptService.processPrompt(prompt);
      return videoScript;
    } catch (error) {
      throw new CustomError(`Failed to generate video script: ${error.message}`, 500);
    }
  }
}

export default VideoScriptService;
