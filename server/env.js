export class EnvValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "EnvValidationError";
    this.code = code;
  }
}

export function validateEnv(env = process.env) {
  return {
    PORT: env.PORT
  };
}
