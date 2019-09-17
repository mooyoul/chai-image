/// <reference types="chai" />
import { MatchImageOptions } from "./index";

// tslint:disable-next-line
declare global {
  export namespace Chai {
    interface Assertion extends LanguageChains, NumericComparison, TypeComparison {
      matchImage(expected: Buffer, options?: MatchImageOptions): Assertion;
    }
  }
}
