declare const emailValidation: {
  validate: (email: string) => Promise<{
    valid: boolean;
    score: number;
    errors: string[];
    warnings: string[];
    checks: { format: boolean; disposable: boolean; dns: boolean };
  }>;
};
export default emailValidation;
