const STATUS_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION_ERROR: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

const MESSAGES = {
    SUCCESS: 'Operation successful',
    CREATED: 'Resource created successfully',
    
    BAD_REQUEST: 'Bad request',
    UNAUTHORIZED: 'Unauthorized: Access token is missing or invalid',
    FORBIDDEN: 'Forbidden: You do not have permission to access this resource',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource already exists',
    VALIDATION_ERROR: 'Validation error',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    SERVICE_UNAVAILABLE: 'Service unavailable',

    // Auth specific
    REGISTRATION_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    PASSWORD_RESET_EMAIL_SENT: 'Password reset link sent to your email',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully',
    PASSWORD_CHANGE_SUCCESS: 'Password changed successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    TOKEN_EXPIRED: 'Access token expired',
    TOKEN_INVALID: 'Access token invalid',

    // User specific
    USER_NOT_FOUND: 'User not found',
    PROFILE_UPDATED: 'Profile updated successfully',
    USER_DELETED: 'User deleted successfully',

  
   

  
    // Media specific
    FILE_UPLOAD_SUCCESS: 'File(s) uploaded successfully',
    NO_FILE_UPLOADED: 'No file uploaded',
    FILE_NOT_FOUND: 'File not found',
};

export { STATUS_CODES, MESSAGES };