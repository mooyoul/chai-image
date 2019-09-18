// tslint:disable-next-line
/// <reference path="global.d.ts" />

import * as crypto from "crypto";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as path from "path";
import pixelmatch = require("pixelmatch"); // tslint:disable-line
import { PNG } from "pngjs";

export enum Align {
  LEFT_TOP = "leftTop",
  CENTER = "center",
}

export interface DiffOptions {
  threshold?: number;
  includeAA?: boolean;
  alpha?: number;
  aaColor?: [number, number, number];
  /* The color of differing pixels in the diff output. [255, 0, 0] by default. */
  diffColor?: [number, number, number];
}

export interface OutputOptions {
  name: string;
  dir?: string;
  on?: "failure" | "always";
  diffOnly?: boolean;
}

export interface MatchImageOptions {
  diff?: DiffOptions;
  align?: Align;
  output?: OutputOptions;
}

export const chaiImage: Chai.ChaiPlugin = (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {
  const { Assertion } = chai;

  Assertion.addMethod("matchImage", function matchImage(expected: Buffer, options: MatchImageOptions = {}) {
    const actual = this._obj as any;

    // Check Type of parameters
    // In this case, we don't use this.assert since we don't need to support negate
    chai.assert(Buffer.isBuffer(actual), `actual image must be a Buffer, but ${utils.objDisplay(actual)} given`);
    chai.assert(Buffer.isBuffer(expected), `expected image must be a Buffer, but ${utils.objDisplay(expected)} given`);

    const [ imgExpected, imgActual ] = (() => {
      try {
        return loadImages(actual as Buffer, expected as Buffer, options.align);
      } catch (e) {
        if (/invalid/i.test(e.message)) {
          throw new chai.AssertionError("image must be a valid PNG image");
        }

        throw e;
      }
    })();

    // Try hash comparision
    const actualHash = crypto.createHash("sha1").update(imgActual.data).digest();
    const expectedHash = crypto.createHash("sha1").update(imgExpected.data).digest();

    if (actualHash !== expectedHash) {
      // if hash is different, perform imagediff
      const { width, height } = imgExpected;
      const imgDiff = new PNG({ width, height });

      const diffPixelCount = pixelmatch(imgActual.data, imgExpected.data, imgDiff.data, width, height, options.diff);
      const passed = diffPixelCount === 0;

      if (options.output) {
        saveImages(passed, imgActual, imgExpected, imgDiff, options.output);
      }

      this.assert(
        passed,
        `expected image to match given image, but ${diffPixelCount} pixels different`,
        `expected image not to match given image, but none was different`,
        passed,
      );
    }
  });
};

// Load images, and perform pre-processing if needed
function loadImages(bufActual: Buffer, bufExpected: Buffer, align: Align = Align.LEFT_TOP) {
  // Load image pixels first
  const rawExpected = PNG.sync.read(bufExpected);
  const rawActual = PNG.sync.read(bufActual);

  // Check dimensions to decide preprocessing, or not
  const hasEqualDimensions = rawActual.width === rawExpected.width
    && rawActual.height === rawExpected.height;

  // If given two images have same dimensions, skip preprocessing.
  if (hasEqualDimensions) {
    return [ rawExpected, rawActual ];
  }

  const width = Math.max(rawActual.width, rawExpected.width);
  const height = Math.max(rawActual.height, rawExpected.height);

  return [rawExpected, rawActual].map((source) => {
    // Create a new empty PNG image to generate resized image output
    const resized = new PNG({ width, height, fill: true });

    // Compute image position to align
    const [ deltaX, deltaY ] = align === Align.CENTER ? [
      Math.floor((width - source.width) / 2),
      Math.floor((height - source.height) / 2),
    ] : [0, 0];

    // Copy source pixel data into created PNG image
    PNG.bitblt(source, resized, 0, 0, source.width, source.height, deltaX, deltaY);

    // Fill non-source area (background)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isBackgroundPixel = x > source.width || y > source.height;

        if (isBackgroundPixel) {
          const offset = ((width * y) + x) << 2; // tslint:disable-line
          resized.data[offset] = 0x00; // R
          resized.data[offset + 1] = 0x00; // G
          resized.data[offset + 2] = 0x00; // B
          resized.data[offset + 3] = 0x40; // A
        }
      }
    }

    return resized;
  });
}

function saveImages(passed: boolean, imgActual: PNG, imgExpected: PNG, imgDiff: PNG, options: OutputOptions) {
  const {
    name = crypto.randomBytes(4).toString("hex"),
    dir = "output",
    on = "failure",
    diffOnly = false,
  } = options;

  const satisfiedCreation = on === "always" || (on === "failure" && !passed);

  if (satisfiedCreation) {
    mkdirp.sync(dir);

    if (!diffOnly) {
      fs.writeFileSync(path.join(dir, `${name}_actual.png`), PNG.sync.write(imgActual, { filterType: 4 }));
      fs.writeFileSync(path.join(dir, `${name}_expected.png`), PNG.sync.write(imgActual, { filterType: 4 }));
    }

    fs.writeFileSync(path.join(dir, `${name}_diff.png`), PNG.sync.write(imgDiff, { filterType: 4 }));
  }
}
