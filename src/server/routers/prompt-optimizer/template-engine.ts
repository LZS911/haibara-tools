import type {
  CompiledPrompt,
  PromptTemplate,
  TemplateLanguage
} from '@/types/prompt-optimizer';

export class TemplateEngine {
  static compile(
    template: PromptTemplate,
    variables: Record<string, string>,
    language: TemplateLanguage = 'chinese'
  ): CompiledPrompt {
    const system = this.replaceVariables(template.system[language], variables);
    const user = this.replaceVariables(template.user[language], variables);
    return { system, user };
  }

  static validateVariables(
    template: PromptTemplate,
    variables: Record<string, string>
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    for (const variableName of template.variables) {
      const value = variables[variableName];
      if (value === undefined || value === null || value === '') {
        missing.push(variableName);
      }
    }
    return { valid: missing.length === 0, missing };
  }

  private static replaceVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value ?? '');
    }
    return result;
  }
}
