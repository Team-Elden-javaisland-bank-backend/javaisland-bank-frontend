import { MissingTranslationHandler as NgxMissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';

export class CustomMissingTranslationHandler implements NgxMissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (typeof params.key === 'string') {
      console.warn('[i18n] Missing translation key:', params.key);
    }
    return params.key;
  }
}
