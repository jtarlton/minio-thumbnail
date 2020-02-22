# minio-thumbnail
An OpenFaas function to demonstrate handling of Minio webhook notifications.

This is similar to the Minio thumbnailer example. 

## Webhook configuration

Configuration uses environment variables defined in the OpenFaas stack file `minio-thumbnail.yml`

### Minio settings

Name             | Description                 | Example 
-----------------|-----------------------------|---------------
ENDPOINT         | Minio server address        | "minio-service.minio.svc.cluster.local"
PORT             | Minio server port           | "9000"
USE_SSL          | Use "true" for HTTPS access | "false"
ACCESS_KEY       | Account Id                  | "minio"
SECRET_KEY       | Account Password            | "minio123"  
THUMBNAIL_BUCKET | Where to store thumbnails   | "thumbnail-images"
   
### Image settings - optional

Name             | Description                 | Default 
-----------------|-----------------------------|---------------
IMAGE_WIDTH      | Thumbnail width             | "96"
IMAGE_HEIGHT     | Thumbnail height            | "96"
IMAGE_QUALITY    | Quality for JPEG images     | "100"
IMAGE_SUFFIX     | Image file name suffix      | "-thumbnail"

To preserve the aspect ratio of the original image, set _either_ the IMAGE_WIDTH _or_ the IMAGE_HEIGHT to 0.

## Building
The OpenFaas template is based on the standard `node10-express-armhf` template modified to use Node v12 (LTS).

### Build, push and deploy.
```
faas-cli up -f ./minio-thumbnail.yml --gateway=${OPENFAAS_GATEWAY}
```

## Testing

Create buckets:
```
mc mb myminio/images
mc mb myminio/thumbnail-images
```

Define the web-hook endpoint:
```
mc admin config set myminio notify_webhook:1 queue_limit="0" endpoint="http://${OPENFAAS_GATEWAY}/function/thumbnail" queue_dir=""
mc admin service restart myminio
```

Setup a notification event for whenever a file is added to the `images` bucket:
```
mc event add myminio/images arn:minio:sqs::1:webhook --event put 
```

Upload an image:
```
mc cp photo.jpeg myminio/images
```

Verify the thumbnail was generated and uploaded:
```
mc ls local/thumbnail-images
```
 
## References

OpenFaas https://github.com/openfaas/faas

Minio notifications https://docs.min.io/docs/minio-bucket-notification-guide.html#webhooks

Minio example https://github.com/minio/thumbnailer

Jimp libary https://github.com/oliver-moran/jimp

