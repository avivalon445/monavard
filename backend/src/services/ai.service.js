const OpenAI = require('openai');
const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * AI Service
 * Handles AI categorization using OpenAI
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get all active categories for AI prompt
 */
const getActiveCategories = async () => {
  try {
    const categories = await db.query(
      'SELECT id, name, description FROM categories WHERE is_active = 1 ORDER BY name',
      []
    );
    return categories;
  } catch (error) {
    logger.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Categorize a request using OpenAI
 */
const categorizeRequest = async (requestId) => {
  const startTime = Date.now();
  
  try {
    // Get request details
    const [request] = await db.query(
      'SELECT id, title, description, budget_min, budget_max, currency, delivery_date FROM requests WHERE id = ?',
      [requestId]
    );
    
    if (!request) {
      throw new ApiError(404, 'Request not found');
    }
    
    // Get active categories
    const categories = await getActiveCategories();
    
    if (categories.length === 0) {
      throw new ApiError(500, 'No active categories available');
    }
    
    // Build category list for prompt
    const categoryList = categories.map(cat => 
      `- ${cat.name}: ${cat.description || 'No description'}`
    ).join('\n');
    
    // Build the prompt
    const prompt = `You are a professional categorization assistant for a CustomBid platform. Your task is to analyze a customer's product/service request and categorize it into the most appropriate category.

**Request Details:**
Title: ${request.title}
Description: ${request.description}
${request.budget_min && request.budget_max ? `Budget: ${request.budget_min}-${request.budget_max} ${request.currency}` : ''}
${request.delivery_date ? `Delivery Date: ${request.delivery_date}` : ''}

**Available Categories:**
${categoryList}

**Instructions:**
1. Carefully analyze the request title and description
2. Choose the SINGLE most appropriate category from the list above
3. If no category fits well, choose "Other"
4. Provide a confidence score (0.0 to 1.0) indicating how well the request matches the category
5. Provide a brief reasoning (1-2 sentences) explaining your choice

**Response Format (JSON only):**
{
  "category": "Category Name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen"
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional categorization assistant. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 200,
      response_format: { type: "json_object" }
    });
    
    const processingTime = Date.now() - startTime;
    
    // Parse AI response
    const aiResponse = completion.choices[0].message.content;
    const parsed = JSON.parse(aiResponse);
    
    // Validate response
    if (!parsed.category || !parsed.confidence || !parsed.reasoning) {
      throw new ApiError(500, 'Invalid AI response format');
    }
    
    // Find matching category (case-insensitive)
    const matchedCategory = categories.find(
      cat => cat.name.toLowerCase() === parsed.category.toLowerCase()
    );
    
    if (!matchedCategory) {
      // Default to "Other" if category not found
      const otherCategory = categories.find(cat => cat.name.toLowerCase() === 'other');
      return {
        success: true,
        categoryId: otherCategory?.id || null,
        categoryName: otherCategory?.name || 'Other',
        confidence: 0.5,
        reasoning: `AI suggested "${parsed.category}" but it's not in our categories. Defaulted to Other.`,
        tokensUsed: completion.usage.total_tokens,
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        processingTime,
        rawResponse: aiResponse
      };
    }
    
    return {
      success: true,
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      confidence: Math.min(Math.max(parsed.confidence, 0), 1), // Ensure 0-1 range
      reasoning: parsed.reasoning,
      tokensUsed: completion.usage.total_tokens,
      promptTokens: completion.usage.prompt_tokens,
      completionTokens: completion.usage.completion_tokens,
      processingTime,
      rawResponse: aiResponse
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Handle OpenAI-specific errors
    if (error.response?.status === 429) {
      // Rate limit error
      return {
        success: false,
        error: 'Rate limit exceeded',
        errorMessage: error.message,
        processingTime,
        retryAfter: error.response.headers['retry-after'] || 60
      };
    }
    
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Invalid API key',
        errorMessage: 'OpenAI API key is invalid or missing',
        processingTime
      };
    }
    
    // Log and return generic error
    logger.error('AI categorization error:', error);
    return {
      success: false,
      error: error.message || 'AI categorization failed',
      errorMessage: error.message,
      processingTime
    };
  }
};

/**
 * Log categorization attempt
 */
const logCategorizationAttempt = async (requestId, attemptNumber, result) => {
  try {
    await db.query(
      `INSERT INTO ai_categorization_log (
        request_id, attempt_number, ai_provider, suggested_category,
        confidence_score, reasoning, raw_response, processing_time_ms,
        success, error_message, tokens_used, model_used,
        prompt_tokens, completion_tokens, total_tokens
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        attemptNumber,
        'openai',
        result.categoryName || null,
        result.confidence || null,
        result.reasoning || null,
        result.rawResponse || null,
        result.processingTime || null,
        result.success ? 1 : 0,
        result.errorMessage || null,
        result.tokensUsed || null,
        process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        result.promptTokens || null,
        result.completionTokens || null,
        result.tokensUsed || null
      ]
    );
  } catch (error) {
    logger.error('Error logging categorization attempt:', error);
    // Don't throw - logging failure shouldn't stop the process
  }
};

/**
 * Log rate limit error
 */
const logRateLimit = async (requestId, errorMessage, retryAfter) => {
  try {
    await db.query(
      'INSERT INTO ai_rate_limits (request_id, error_message, retry_after) VALUES (?, ?, ?)',
      [requestId, errorMessage, retryAfter || null]
    );
  } catch (error) {
    logger.error('Error logging rate limit:', error);
  }
};

/**
 * Update request with category
 */
const updateRequestCategory = async (requestId, categoryId, confidence, reasoning) => {
  try {
    await db.query(
      `UPDATE requests 
       SET category_id = ?, 
           ai_categorized = 1, 
           ai_confidence = ?,
           ai_reasoning = ?,
           status = CASE 
             WHEN status = 'pending_categorization' THEN 'open_for_bids'
             ELSE status
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [categoryId, confidence, reasoning, requestId]
    );
    
    logger.info(`Request ${requestId} categorized successfully with category ${categoryId}`);
  } catch (error) {
    logger.error('Error updating request category:', error);
    throw error;
  }
};

/**
 * Get AI usage statistics
 */
const getUsageStatistics = async (days = 30) => {
  try {
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total_categorizations,
        SUM(success) as successful_categorizations,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_categorizations,
        AVG(processing_time_ms) as avg_processing_time_ms,
        SUM(total_tokens) as total_tokens_used,
        AVG(confidence_score) as avg_confidence_score
       FROM ai_categorization_log
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );
    
    return stats[0] || {
      total_categorizations: 0,
      successful_categorizations: 0,
      failed_categorizations: 0,
      avg_processing_time_ms: 0,
      total_tokens_used: 0,
      avg_confidence_score: 0
    };
  } catch (error) {
    logger.error('Error fetching usage statistics:', error);
    throw error;
  }
};

module.exports = {
  categorizeRequest,
  logCategorizationAttempt,
  logRateLimit,
  updateRequestCategory,
  getUsageStatistics,
  getActiveCategories
};

