export function createResponse(
  message: string,
  statusCode: number,
  data?: any
) {
  return {
    message,
    statusCode,
    ...(data !== undefined && { data }), // This only includes 'data' if it's defined
  };
}
