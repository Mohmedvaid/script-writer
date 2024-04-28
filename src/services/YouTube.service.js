import { google } from 'googleapis';
import CustomError from '../utils/CustomError';
// import { YOUTUBE_API_KEY } from '../config/app.config';

/**
 * YouTube Service to initialize and extract captions from YouTube videos
 */
class YouTubeService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile:
        '/Users/husainvaid/Local_Desktop/projects/youtube/script-writer/trip-planner-381201-3a7f55577ea7.json', // Path to the JSON key file
      scopes: ['https://www.googleapis.com/auth/youtube.force-ssl'] // Scopes needed for the YouTube Data API
    });
    // Create a YouTube Data API client
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.auth
    });

    // this.apiKey = YOUTUBE_API_KEY; // Load API key from environment variables
  }

  /**
   * Extracts video ID from a YouTube link
   * @param {string} videoLink - YouTube video link
   * @returns {string} - Extracted video ID
   * @throws {CustomError} - If the video ID can't be extracted
   */
  extractVideoId(videoLink) {
    const videoId = videoLink.split('v=')[1] || videoLink; // Extract video ID from 'v=' or return link if no split
    if (!videoId) {
      throw new CustomError('Invalid YouTube video link', 400); // Handle invalid video link
    }
    return videoId;
  }

  /**
   * Extracts captions from a YouTube video based on video ID
   * @param {string} videoId - The YouTube video ID
   * @returns {Promise<Array>} - Array of captions
   * @throws {CustomError} - If an error occurs during caption retrieval
   */
  async extractCaptions(videoLink) {
    if (!videoLink) {
      throw new CustomError('Video ID is required', 400); // Ensure video ID is provided
    }
    const videoId = this.extractVideoId(videoLink); // Extract video ID from link

    try {
      console.log({ videoId });
      const response = await this.youtube.captions.list({
        part: 'snippet',
        videoId: videoId,
        // key: this.apiKey, // Include API key
        hl: 'en' // Language code (optional)
      });

      if (response.data.items.length === 0) {
        throw new CustomError('No captions found for this video', 404); // Handle missing captions
      }
      // loop over the items and the one with trackKind = 'asr' is the one we want
      const caption = response.data.items.find((item) => item.snippet.trackKind === 'asr');
      console.log({ caption });

      if (!caption) {
        throw new CustomError('No ASR captions found for this video', 404); // Handle missing captions
      }
      const downloadedCaption = await this.youtube.captions.download({
        id: caption.id,
        tfmt: 'txt'
        // key: this.apiKey
      });
      console.log(downloadedCaption.data);

      const transcript = downloadedCaption.data;

      return transcript;
    } catch (error) {
      throw new CustomError(`Failed to extract captions: ${error.message}`, 500); // Handle errors
    }
  }
}

export default YouTubeService;
