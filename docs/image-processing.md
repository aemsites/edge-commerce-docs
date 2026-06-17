---
title: "Image processing"
description: "How external product images are fetched, stored, and verified."
status: migrated
managed: true
sourceFormat: markdown
---

# Image processing

When you provide external image URLs in your product data, the Image Collector service fetches, processes, and stores them in the media bus. This section explains the processing behavior, error handling, and how to verify image status.

## Processing modes

Image processing runs in one of two modes depending on the size of your request. For small requests (10 or fewer products with 10 or fewer total images), processing is synchronous, images are fetched and stored before the API returns. For larger requests, processing is asynchronous, the API returns immediately while images are queued for background processing.

## How images are stored

External images are downloaded, hashed using SHA-1, and stored with content-based filenames like `./media_a3f5b8c1d2e4f6g7h8i9j0k1l2m3n4o5p6q7r8s9.jpg`. The hash is computed from the image content, enabling automatic deduplication, if the same image is used across multiple products, it's stored only once. After processing, image URLs in your product data are transformed from external URLs to these relative paths.

## Checking image processing status

To verify whether images have been processed, fetch the product data via the JSON endpoint and inspect the image URLs. Processed images have relative paths starting with `./media_` followed by a 40-character hash. Unprocessed images retain their original external URLs (starting with `https://`). For example:

```json
{
  "images": [
    { "url": "./media_a3f5b8c1d2e4f6g7h8i9j0k1l2m3n4o5p6q7r8s9.jpg" },
    { "url": "https://cdn.example.com/pending-image.jpg" }
  ]
}
```

In this example, the first image has been processed and stored, while the second is still pending or failed.

## Error handling

When an image fails to download, the system retries up to 3 times with exponential backoff for rate-limiting (429) and forbidden (403) responses. If all retries fail, the error is logged and the original external URL is preserved in the product data. The product is still saved successfully, only the failed image remains unprocessed. Other images in the same product are processed independently, so a single failed image doesn't block the others.

Common reasons for image fetch failures include the source URL returning 404, the source server rate-limiting requests, authentication required (images must be publicly accessible), and network timeouts.

## Processing timeline

After submitting products with external images, the processing timeline depends on your request size. For synchronous processing, images are available immediately when the API returns. For asynchronous processing, images are typically processed within a few minutes. After processing completes, the system automatically purges the CDN cache for affected products and triggers re-indexing so that indexes and feeds reflect the new image URLs.

## Best practices

To ensure reliable image processing, use publicly accessible image URLs without authentication requirements. Prefer stable URLs that don't change, the system caches the mapping between source URLs and stored images, so changing the source URL for the same image creates duplicates. If you need to replace an image, use a new URL. For large catalogs, batch your uploads to avoid overwhelming external image servers, and monitor your product data to verify images are being processed successfully.

## Next steps

- [Schema Reference](/schema-reference#productbusmedia): The media schema and image fields
- [Caching strategy](/caching#push-invalidation): How updated images propagate through the CDN
