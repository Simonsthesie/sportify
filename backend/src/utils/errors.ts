export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const BadRequest = (message: string, details?: unknown) => new HttpError(400, message, details);
export const Unauthorized = (message = 'Non authentifie') => new HttpError(401, message);
export const Forbidden = (message = 'Acces interdit') => new HttpError(403, message);
export const NotFound = (message = 'Ressource introuvable') => new HttpError(404, message);
export const Conflict = (message: string) => new HttpError(409, message);
