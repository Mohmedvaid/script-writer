import VideoScriptService from '../../services/VideoScript.service';
import CustomError from '../../utils/CustomError';
import isString from '../../utils/isString';

/**
 * Controller to create video scripts based on user data
 * @param {Express.Request} req - Request object
 * @param {Express.Response} res - Response object
 * @param {Express.NextFunction} next - Next middleware function
 */
const generate = async (req, res, next) => {
  try {
    // Initialize the service
    const videoScriptService = new VideoScriptService();

    // Get user data from the request body
    const { content } = req.body;
    if (!content) throw new CustomError('Content is required to generate a script', 400);
    if (!isString(content)) throw new CustomError('Content must be a string', 400);

    // Use the service to generate a video script
    const script = await videoScriptService.generateVideoScript(content);

    // Return the generated script with a standardized response
    return res.standardResponse(201, true, script, 'Video script created successfully');
  } catch (error) {
    return next(error);
  }
};

export { generate };
