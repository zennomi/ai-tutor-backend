export enum ErrorCode {
  // Common Validation
  V000 = 'COMMON_VALIDATION_ERROR',

  // Validation
  V001 = 'USER_IS_EMPTY',
  V002 = 'USER_IS_INVALID',

  // Error
  E001 = 'USERNAME_OR_EMAIL_EXISTS',
  E002 = 'USER_NOT_FOUND',
  E003 = 'EMAIL_EXISTS',
}
