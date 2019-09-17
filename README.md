# chai-image

![Build Status](https://github.com/mooyoul/chai-image/workflows/workflow/badge.svg)
![Semantic Release enabled](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
[![MIT license](http://img.shields.io/badge/license-MIT-blue.svg)](http://mooyoul.mit-license.org/)

Extends Chai with assertions about images

```typescript
expect(bufImage).to.matchImage(bufExpectedImage);
```

| Expected | Actual | Diff |
| --- | --- | --- |
| ![Expected Image](fixtures/red_velvet_perfect_velvet_all_2_co_m_l.png) | ![Actual Image](fixtures/red_velvet_perfect_velvet_all_2_co_l.png) | ![Diff Image](fixtures/test_diff.png) |

In this case, `matchImage` assertion will fail.

## Usage

Install `chai-image` to get up and running. 

```bash
$ npm install chai-image --save-dev
```

Then:

```typescript
import * as chai from "chai";
import { chaiImage } from "chai-image";

chai.use(chaiImage);

// Then either:
const expect = chai.expect;
// or:
const assert = chai.assert;
// or:
chai.should();
// according to your preference of assertion style

```

## Assertions

#### `matchImage(expected: Buffer, options?: MatchImageOptions)`

> NOTE: Currently it only supports PNG image format.

Tests image matches to given image or not.

Image comparision is proceeded by [pixelmatch](https://github.com/mapbox/pixelmatch) library.
If output config is provided, `chai-image` will create some files to show diff results.



```typescript

interface MatchImageOptions {
  // Custom diff config passed to pixelmatch
  diff?: DiffOptions;
  
  // Output config
  // if specified, chai-image will create output files to visualize diff 
  output?: OutputOptions;
}

interface DiffOptions {
  threshold?: number;
  includeAA?: boolean;
  alpha?: number;
  aaColor?: [number, number, number];
  /* The color of differing pixels in the diff output. [255, 0, 0] by default. */
  diffColor?: [number, number, number];
}

interface OutputOptions {
  // Currently name is used to generate filename
  name: string;
  // Path of output directory (default: WORKDING_DIR/outputs)
  dir?: string;
  
  // Output creation conditions
  // Controls when to create output files (default: failure)
  on?: "failure" | "always";
  
  // Controls output file types (default: false)
  diffOnly?: boolean;
}
```

## Changelog



## Testing

```bash
$ npm run test
```

## Build

```bash
$ npm run build
```


## License
[MIT](LICENSE)

See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)
