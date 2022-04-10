'use strict';

const EasyYandexS3 = require("easy-yandex-s3");
const sharp  = require('sharp');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const STRAPI_IMAGE_PREFIXES = ['thumbnail_', 'large_', 'medium_', 'small_'];
const ACCESS_LEVEL = [
  "private",
  "public-read",
  "public-read-write",
  "authenticated-read",
  "bucket-owner-read",
  "bucket-owner-full-control",
];

module.exports = {
  init(config) {
    let yandexConfig = {
      region: config.region
    };

    if (config.accessKeyId && config.secretAccessKey) {
      yandexConfig = {
        accessKeyId: config.accessKeyId.trim(),
        secretAccessKey: config.secretAccessKey.trim(),
        ...yandexConfig,
      }
    }

    const S3 = new EasyYandexS3({
      endpoint: config.endpoint,
      params: config.params,
      ...yandexConfig,
    });

    return {
      upload: async file => {

        if (
          config.thumbnails &&
          IMAGE_EXTENSIONS.includes(file.ext.toLowerCase()) &&
          new RegExp(STRAPI_IMAGE_PREFIXES.join('|')).test(file.hash) === false
        ) {

          const thumbs = await generateImages(file, config);

          thumbs.forEach(images => {
            images.forEach(image => {
              S3Upload(S3)(image, `${image.name}_${file.hash}${image.ext}`, config);
            });
          });
        }

        return S3Upload(S3)(file, `${file.hash}${file.ext}`, config);
      },
      delete: async file => {

        if (
          config.thumbnails &&
          IMAGE_EXTENSIONS.includes(file.ext.toLowerCase()) &&
          new RegExp(STRAPI_IMAGE_PREFIXES.join('|')).test(file.hash) === false
        ) {
          config.thumbnails.forEach(item => {
            S3Delete(S3)(file, `${item.name}_${file.hash}${file.ext}`, config);

            if (config.webp) {
              S3Delete(S3)(file, `${item.name}_${file.hash}.webp`, config);
            }
          });
        }

        if (config.webp) {
          S3Delete(S3)(file, `${file.hash}.webp`, config);
        }

        return S3Delete(S3)(file, `${file.hash}${file.ext}`, config);
      },
    };
  },
};

const getAccessLevel = (config) => {
  if (config.accessLevel) {
    if (ACCESS_LEVEL.includes(config.accessLevel)) {
      return config.accessLevel
    }
    throw Error(
      `The object access level: ${config.accessLevel} is not valid. Please choose from: private, public-read, public-read-write, authenticated-read, bucket-owner-read or bucket-owner-full-control`
    );
    
  }
  // default access level
  return 'public-read'
}

const S3Upload = S3 => (file, key, config) => {
  return new Promise((resolve, reject) => {

    const path = file.path ? `${file.path}/` : '';
    const prefix = config.prefix ? config.prefix.trim() : '';
    const objectKey = `${prefix}${path}${key}`;
    const accessLevel = getAccessLevel(config)

    S3.upload({
        Key: objectKey,
        Body: file.buffer instanceof Buffer ? file.buffer : new Buffer(file.buffer, 'binary'),
        ContentType: file.mime,
        ACL: accessLevel
      },
      (err, data) => {
        if (err) {
          return reject(err);
        }

        file.url = (config.customDomain && config.customDomain !== '-') ? `${config.customDomain}/${objectKey}` : data.Location;

        strapi.log.info(`Uploaded file: ${key}`);

        resolve();
      }
    );
  });
}

const S3Delete = S3 => (file, key, config) => {
  return new Promise((resolve, reject) => {
    const path = file.path ? `${file.path}/` : '';
    const prefix = config.prefix ? config.prefix.trim() : '';
    const objectKey = `${prefix}${path}${key}`;

    S3.deleteObject({
        Key: objectKey,
      },(err, data) => {
        if (err) {
          strapi.log.error(err);
          return reject(err);
        }

        strapi.log.info(`Deleted file: ${key}`);

        resolve();
      }
    );
  });
}

const generateImages = async (file, config) => {
  const buffer = new Buffer(file.buffer, 'binary');

  const { thumbnails, webp, quality } = config;

  const imagesToCreate = thumbnails.map(async item => {
    const { name, options } = item;
    const images = [];

    switch (file.ext.toLowerCase()) {
      case '.png':
        images.push(
          await sharp(buffer).resize(options || {})
            .png({ quality: parseInt(quality) }).toBuffer()
            .then(data => ({
              buffer: data,
              mime: file.mime,
              ext: file.ext,
              name,
            }))
        );
        break;
      case '.webp':
        images.push(
          await sharp(buffer).resize(options || {})
            .webp({ quality: parseInt(quality) }).toBuffer()
            .then(data => ({
              buffer: data,
              mime: file.mime,
              ext: file.ext,
              name,
            }))
        );
        break;
      case '.jpg':
      case '.jpeg':
        images.push(
          await sharp(buffer).resize(options || {})
            .jpeg({ quality: parseInt(quality) }).toBuffer()
            .then(data => ({
              buffer: data,
              mime: file.mime,
              ext: file.ext,
              name,
            }))
        );
        break;
    }

    if (webp && file.mime !== 'image/webp') {
      images.push(
        await sharp(buffer).resize(options || {})
          .webp({ quality: parseInt(quality) }).toBuffer()
          .then(data => ({
            buffer: data,
            mime: 'image/webp',
            ext: '.webp',
            name,
          }))
      );
    }

    return images;
  });

  return Promise.all(imagesToCreate);
};