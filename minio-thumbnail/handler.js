/**
 * OpenFaas function to demonstrate handling of Minio webhook notifications.
 *
 * Minio should be configured to send a notification whenever an image is
 * uploaded to a bucket. When invoked, this function will fetch the image,
 * resize it and upload the resized file to the another bucket.
 */

'use strict';

module.exports = async (event, context) => {
  const Minio = require('minio');
  const minioClient = new Minio.Client({
    endPoint: process.env.ENDPOINT,
    port: parseInt(process.env.PORT),
    useSSL: Boolean(process.env.USE_SSL == 'true'),
    accessKey: process.env.ACCESS_KEY,
    secretKey: process.env.SECRET_KEY
  });

  let bucketName;
  let objectKey;
  try {
    bucketName = event.body.Records[0].s3.bucket.name;
    objectKey = event.body.Records[0].s3.object.key;
  } catch (e) {
    console.log(e.message);
    return context.status(400).fail('Bad request');
  }
  const thumbnailBucketName = process.env.THUMBNAIL_BUCKET;
  if (thumbnailBucketName === bucketName) {
	console.log('Source and destination buckets are the same');
    return context.status(400).fail('Bad request'); 
  }
  console.log(`bucketName: "${bucketName}", objectKey: "${objectKey}"`);

  const tmp = require('tmp-promise');
  let tempFile;
  try {
	tempFile = await tmp.tmpName();
  } catch {
    console.log(e.message);
    return context.status(500).fail('Internal error');  
  }
  const fsPromises = require('fs').promises;
  try {
    await minioClient.fGetObject(bucketName, objectKey, tempFile);
  } catch (e) {
    console.log(e.message);
    await fsPromises.unlink(tempFile).catch(e => console.log(e.message));
    return context.status(404).fail('Object not found');
  }

  const width = parseInt(process.env.IMAGE_WIDTH) || 96;
  const height = parseInt(process.env.IMAGE_HEIGHT) || 96;
  const quality = parseInt(process.env.IMAGE_QUALITY) || 100;
  const transform = require('./transform');
  let mimetype;
  try {
    mimetype = await transform(tempFile, width, height, quality);
  } catch (e) {
    console.log(e.message);
    await fsPromises.unlink(tempFile).catch(e => console.log(e.message));
    return context.status(400).fail('Unsupported image format');
  }

  const suffix = process.env.IMAGE_SUFFIX || '-thumbnail';
  const thumbnailName = objectKey.replace(
    /^([^.]+)$|(\.[^.]+)$/i,
    '$1' + suffix + '$2'
  );
  console.log(`Uploading image "${thumbnailName}"`);
  let metaData = {
    'Content-Type': mimetype
  };
  let etag;
  try {
    etag = await minioClient.fPutObject(
      thumbnailBucketName,
      thumbnailName,
      tempFile,
      metaData
    );
  } catch (e) {
    console.log(e.message);
    await fsPromises.unlink(tempFile).catch(e => console.log(e.message));
    return context.status(500).fail('Upload failed');
  }
  console.log(`ETag: ${etag}`);
  await fsPromises.unlink(tempFile).catch(e => console.log(e.message));
  return context.status(200).succeed('');
};
