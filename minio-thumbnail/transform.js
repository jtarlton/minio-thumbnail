'use strict';

/*
 * Jimp - An image processing library for Node written entirely in JavaScript, 
 * with zero native dependencies.
 * https://github.com/oliver-moran/jimp
 */ 
const Jimp = require('jimp');

/**
 * Resize an image.
 *
 * @param String imagePath - image file path.
 * @param Number width -  the width to resize the image to (0 for automatic)
 * @param Number height - the height to resize the image to (0 for automatic)
 * @param Number quality - jpeg quality of the image 
 */
module.exports = async (imagePath, width, height, quality) => {
  console.log(
    `Resizing image, width: ${width}, height: ${height}, quality: ${quality}`
  );
  const image = await Jimp.read(imagePath);
  await image.resize(width ? width : Jimp.AUTO, height ? height : Jimp.AUTO);
  await image.quality(quality);
  await image.writeAsync(imagePath);
  return image.getMIME();
};
