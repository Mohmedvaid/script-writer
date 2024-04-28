// src/services/GPT.service.js
import CustomError from '../utils/CustomError';

/**
 * GPT service to handle prompt-based interactions with GPT
 */
class GPTService {
  /**
   * Sends a prompt to GPT and returns the response
   * @param {string} prompt - The text prompt for GPT
   * @returns {Promise<string>} - The GPT-generated response
   * @throws {CustomError} - If an error occurs during GPT interaction
   */
  async processPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new CustomError('Invalid GPT prompt', 400);
    }

    try {
      // Example GPT interaction (replace with actual GPT logic)
      const gptResponse = `Response for prompt: ${prompt}`;
      return gptResponse;
    } catch (error) {
      throw new CustomError('GPT interaction error', 500);
    }
  }
}

export default GPTService;
