/**
 * Standard API Response class
 */
class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    
    if (data !== null) {
      this.data = data;
    }
    
    if (meta !== null) {
      this.meta = meta;
    }
    
    this.timestamp = new Date().toISOString();
  }

  /**
   * Success Response (200)
   */
  static success(message = 'Success', data = null, meta = null) {
    return new ApiResponse(200, message, data, meta);
  }

  /**
   * Created Response (201)
   */
  static created(message = 'Resource created successfully', data = null) {
    return new ApiResponse(201, message, data);
  }

  /**
   * No Content Response (204)
   */
  static noContent() {
    return new ApiResponse(204, 'No content');
  }

  /**
   * Paginated Response
   */
  static paginated(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    
    const meta = {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
    
    return new ApiResponse(200, 'Success', data, meta);
  }

  /**
   * Send response
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      ...(this.data !== undefined && { data: this.data }),
      ...(this.meta !== undefined && { meta: this.meta }),
      timestamp: this.timestamp
    });
  }
}

module.exports = ApiResponse;

