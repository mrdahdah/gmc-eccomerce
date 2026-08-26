import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

// One fixed transformation for EVERY product photo, so the catalog looks uniform:
// 800x800 fill crop, automatic quality + format (Cloudinary picks webp/avif when supported).
const TRANSFORM = {
  width: 800,
  height: 800,
  crop: 'fill',
  gravity: 'auto',
  quality: 'auto',
  fetch_format: 'auto',
  secure: true,
} as const;

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    const url = config.get<string>('CLOUDINARY_URL');
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    this.enabled = Boolean(url || cloudName);
    if (this.enabled) {
      // CLOUDINARY_URL (cloudinary://key:secret@cloud) is read from env automatically;
      // fall back to explicit vars when only those are set.
      cloudinary.config(
        cloudName
          ? {
              secure: true,
              cloud_name: cloudName,
              api_key: config.get<string>('CLOUDINARY_API_KEY'),
              api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
            }
          : { secure: true },
      );
    } else {
      this.logger.warn('Cloudinary not configured — product images will use their source URL as-is.');
    }
  }

  /**
   * Upload an image (a remote URL or a base64 data URI) and return a URL normalised
   * to the shared quality/size. When Cloudinary is not configured (no env), the source
   * is returned unchanged so the app is still fully demoable.
   */
  async uploadImage(source?: string | null): Promise<string | null> {
    if (!source) return null;
    if (!this.enabled) return source;
    try {
      const res = await cloudinary.uploader.upload(source, { folder: 'shop/products', overwrite: true });
      return cloudinary.url(res.public_id, TRANSFORM);
    } catch (err) {
      this.logger.warn(`Cloudinary upload failed, keeping source URL: ${(err as Error).message}`);
      return source;
    }
  }
}
