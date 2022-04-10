# strapi-provider-upload-yandex-object-storage
![Supported Strapi version](https://img.shields.io/badge/Strapi-3.6.8-green.svg) ![GitHub license](https://img.shields.io/github/license/nekrasovp/strapi-provider-upload-yandex-object-storage.svg)

Yandex Cloud Storage provider for Strapi uploads: thumbnails, image compression, WebP format

## Instalation

```sh
yarn add strapi-provider-upload-yandex-object-storage
```

## Configuration
Update your `./config/plugins.js`:

### For strapi 4.0.0+

```js
    module.exports = ({ env }) => ({
      upload: {
        config: {
          provider: 'yandex-cloud-storage',
          providerOptions: {
            accessKeyId: env('YC_ACCESS_KEY_ID'),
            secretAccessKey: env('YC_ACCESS_SECRET'),
            region: env('YC_REGION'),
            params: {
              Bucket: env('YC_BUCKET'),
            },
            customDomain: env('CDN_DOMAIN'),
            endpoint: env('YC_ENDPOINT'),
            prefix: null,
            quality: 80,
            webp: true,
            accessLevel: env('ACCESS_LEVEL'), // Default set to: 'public-read'
            thumbnails: [
              {
                name: 'custom',
                options: {
                  width: 1200,
                  withoutEnlargement: true,
                },
              },
              {
                name: 'preview',
                options: {
                  width: 500,
                  height: 300,
                  fit: 'cover',
                },
              },
            ],
          },
        },
      },
    });
```

### For strapi 3.6.8

```js
    module.exports = ({ env }) => ({
      upload: {
        provider: 'yandex-cloud-storage',
        providerOptions: {
          accessKeyId: env('YC_ACCESS_KEY_ID'),
          secretAccessKey: env('YC_ACCESS_SECRET'),
          region: env('YC_REGION'),
          params: {
            Bucket: env('YC_BUCKET'),
          },
          customDomain: env('CDN_DOMAIN'),
          endpoint: env('YC_ENDPOINT'),
          prefix: null,
          quality: 80,
          webp: true,
          accessLevel: env('ACCESS_LEVEL'), // Default set to: 'public-read'
          thumbnails: [
            {
              name: 'custom',
              options: {
                width: 1200,
                withoutEnlargement: true,
              },
            },
            {
              name: 'preview',
              options: {
                width: 500,
                height: 300,
                fit: 'cover',
              },
            },
          ],
        },
      },
    });
```

## License

MIT License
