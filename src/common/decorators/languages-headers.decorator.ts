import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const extractPrimaryLangCode = (langHeader: string): string => {
  const languages = langHeader
    .split(',')
    .map((part) => part.split(';')[0].trim());

  const primaryLang = languages[0]?.toLowerCase() || 'ar';

  return primaryLang.split('-')[0] || 'ar';
};

export const Language = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const langHeader = request.headers['accept-language'] || 'ar';
    console.log(langHeader);
    return extractPrimaryLangCode(langHeader);
  },
);
