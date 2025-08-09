
import { createJimp } from "@jimp/core";
import bmp from "@jimp/js-bmp";
import jpg from "@jimp/js-jpeg";
import * as resize from "@jimp/plugin-resize";

export const Jimp = createJimp({
  plugins: [resize.methods],
  formats: [jpg, bmp],
});
