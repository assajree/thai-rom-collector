export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly operation: 'read' | 'create' | 'update' | 'delete'
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
