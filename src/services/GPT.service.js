// src/services/GPT.service.js
import OpenAI from 'openai';
import CustomError from '../utils/CustomError';

class GPTService {
  constructor() {
    // Initialize OpenAI API client
    this.openAI = new OpenAI();
  }

  /**
   * Sends a prompt to GPT-3.5 Turbo and returns the response
   * @param {string} prompt - The text prompt for GPT
   * @returns {Promise<string>} - The GPT-generated response
   * @throws {CustomError} - If an error occurs during GPT interaction
   */
  async processPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new CustomError('Invalid GPT prompt', 400);
    }

    try {
      // Construct the GPT-3.5 Turbo request
      const response = await this.openAI.chat.completions.create({
        model: 'gpt-3.5-turbo', // Specify the GPT model
        messages: [
          {
            role: 'user', // The role of the message
            content: prompt // The user's prompt
          }
        ]
      });
      const results = response.choices[0].message.content;
      console.log({ results });
      return results;
    } catch (error) {
      throw new CustomError(`GPT interaction error: ${error.message}`, 500);
    }
  }
}

export default GPTService;
