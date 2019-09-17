import { AssertionError, expect, use as useChaiPlugin } from "chai";
import * as del from "del";
import * as fs from "fs";

import { chaiImage, OutputOptions } from "./index";

useChaiPlugin(chaiImage);

describe("chai-image", () => {
  describe("#matchImage assertion", () => {
    context("when type of actual value is invalid", () => {
      it("should throw AssertionError", () => {
        expect(() => {
          expect("abc").to.matchImage(Buffer.alloc(8));
        }).to.throw(AssertionError).with.property("message", "actual image must be a Buffer, but 'abc' given");
      });
    });

    context("when type of expected value is invalid", () => {
      it("should throw AssertionError", () => {
        expect(() => {
          // Currently TypeScript typing disallows non-Buffer input anyway
          expect(Buffer.alloc(8)).to.matchImage("abc" as any);
        }).to.throw(AssertionError).with.property("message", "expected image must be a Buffer, but 'abc' given");
      });
    });

    context("when value is not valid PNG image", () => {
      it("should throw AssertionError", () => {
        expect(() => {
          expect(Buffer.alloc(8)).to.matchImage(Buffer.alloc(8));
        }).to.throw(AssertionError).with.property("message", "image must be a valid PNG image");
      });
    });

    context("when actual image does not match to expected image", () => {
      it("should throw AssertionError", () => {
        expect(() => {
          // Currently TypeScript typing disallows non-Buffer input anyway
          expect(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          ).to.matchImage(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_m_l.png"),
          );
        }).to.throw(AssertionError)
        .with.property("message", "expected image to match given image, but 202175 pixels different");
      });

      it("should not throw AssertionError if negated", () => {
        expect(() => {
          expect(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          ).to.not.matchImage(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_m_l.png"),
          );
        }).to.not.throw(AssertionError);
      });
    });

    context("when actual image equals to expected image", () => {
      it("should not throw AssertionError", () => {
        expect(() => {
          expect(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          ).to.matchImage(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          );
        }).to.not.throw(AssertionError);
      });

      it("should throw AssertionError if negated", () => {
        expect(() => {
          expect(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          ).to.not.matchImage(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          );
        }).to.throw(AssertionError)
        .with.property("message", "expected image not to match given image, but none was different");
      });
    });

    context("when actual image matches to expected image with threshold", () => {
      it("should not throw AssertionError", () => {
        expect(() => {
          expect(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          ).to.matchImage(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_m_l.png"), {
              diff: {
                threshold: 0.95,
              },
            },
          );
        }).to.not.throw(AssertionError);
      });

      it("should throw AssertionError if negated", () => {
        expect(() => {
          expect(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          ).to.not.matchImage(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_m_l.png"), {
              diff: {
                threshold: 0.95,
              },
            },
          );
        }).to.throw(AssertionError)
          .with.property("message", "expected image not to match given image, but none was different");
      });
    });

    describe("for output creation", () => {
      const dir = "test_output";

      // Helpers
      const pass = (output?: OutputOptions) => {
        expect(
          fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
        ).to.matchImage(
          fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          { output },
        );
      };

      const fail = (output?: OutputOptions) => {
        try {
          expect(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_l.png"),
          ).to.matchImage(
            fs.readFileSync("fixtures/red_velvet_perfect_velvet_all_2_co_m_l.png"),
            { output },
          );
        } catch (e) { /* no op */ }
      };

      afterEach(() => {
        del.sync(dir);
      });

      context("when output options is not set", () => {
        it("should not save any outputs", () => {
          pass();
          fail();

          expect(() => {
            fs.statSync(dir);
          }).to.throw(Error).with.property("code", "ENOENT");
        });
      });

      context("when output options is set", () => {
        context("with on = failure", () => {
          const options = { name: "test", on: "failure" as const, dir };

          it("should not save outputs if test passed", () => {
            pass(options);

            expect(() => {
              fs.statSync(dir);
            }).to.throw(Error).with.property("code", "ENOENT");
          });

          it("should save outputs if test failed", () => {
            fail(options);

            expect(() => {
              fs.statSync(`${dir}/test_actual.png`);
              fs.statSync(`${dir}/test_expected.png`);
              fs.statSync(`${dir}/test_diff.png`);
            }).to.not.throw(Error);
          });
        });

        context("with on = always", () => {
          const options = { name: "test", on: "always" as const, dir };

          it("should save outputs if test passed", () => {
            pass(options);

            expect(() => {
              fs.statSync(`${dir}/test_actual.png`);
              fs.statSync(`${dir}/test_expected.png`);
              fs.statSync(`${dir}/test_diff.png`);
            }).to.not.throw(Error);
          });

          it("should save outputs if test failed", () => {
            fail(options);

            expect(() => {
              fs.statSync(`${dir}/test_actual.png`);
              fs.statSync(`${dir}/test_expected.png`);
              fs.statSync(`${dir}/test_diff.png`);
            }).to.not.throw(Error);
          });
        });

        context("with diffOnly = true", () => {
          const options = { name: "some-name", diffOnly: true, dir };

          it("should save diff image only", () => {
            fail(options);

            expect(() => {
              fs.statSync(`${dir}/some-name_actual.png`);
            }).to.throw(Error).with.property("code", "ENOENT");

            expect(() => {
              fs.statSync(`${dir}/some-name_expected.png`);
            }).to.throw(Error).with.property("code", "ENOENT");

            expect(() => {
              fs.statSync(`${dir}/some-name_diff.png`);
            }).to.not.throw(Error);
          });
        });
      });
    });
  });
});
