# minio-thumbnail
An OpenFaas function to demonstrate handling of Minio webhook notifications.

When invoked, this function will fetch the image, resize it and upload the resized file to the original bucket under a modified name.
