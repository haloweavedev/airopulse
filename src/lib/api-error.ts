export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.statusCode }
    );
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('Unhandled error:', error);
  return Response.json(
    { error: 'INTERNAL_ERROR', message },
    { status: 500 }
  );
}
