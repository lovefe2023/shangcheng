/**
 * 文件上传路由
 * 支持图片上传
 */

import { Router, Request, Response } from 'express';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'server', 'uploads');

// 确保上传目录存在
const ensureUploadDir = async () => {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// 允许的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// 最大文件大小 (5MB)
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/upload/image
 * 上传单个图片
 */
router.post('/image', requireAuth, async (req: Request, res: Response) => {
  try {
    const { image, filename } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '缺少图片数据'
        }
      });
    }

    // 验证 base64 格式
    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: '无效的图片格式，请使用 base64 编码'
        }
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: '不支持的图片类型，仅支持 jpg、png、gif、webp'
        }
      });
    }

    // 验证文件大小
    const sizeInBytes = Buffer.byteLength(base64Data, 'base64');
    if (sizeInBytes > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '图片大小不能超过 5MB'
        }
      });
    }

    // 确保上传目录存在
    await ensureUploadDir();

    // 生成文件名
    const ext = mimeType.split('/')[1];
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = filename ? `${filename.replace(/[^a-zA-Z0-9_-]/g, '')}_${timestamp}.${ext}` : `${timestamp}_${randomStr}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // 写入文件
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filePath, buffer);

    // 返回可访问的 URL
    const imageUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: fileName,
        size: sizeInBytes,
        type: mimeType
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: '上传失败'
      }
    });
  }
});

/**
 * POST /api/upload/images
 * 批量上传图片
 */
router.post('/images', requireAuth, async (req: Request, res: Response) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '缺少图片数据'
        }
      });
    }

    // 限制批量上传数量
    if (images.length > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: '一次最多上传 5 张图片'
        }
      });
    }

    // 确保上传目录存在
    await ensureUploadDir();

    const uploadedUrls: string[] = [];
    const errors: { index: number; message: string }[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        // 验证 base64 格式
        const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) {
          errors.push({ index: i, message: '无效的图片格式' });
          continue;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // 验证文件类型
        if (!ALLOWED_TYPES.includes(mimeType)) {
          errors.push({ index: i, message: '不支持的图片类型' });
          continue;
        }

        // 验证文件大小
        const sizeInBytes = Buffer.byteLength(base64Data, 'base64');
        if (sizeInBytes > MAX_SIZE) {
          errors.push({ index: i, message: '图片大小超过 5MB' });
          continue;
        }

        // 生成文件名
        const ext = mimeType.split('/')[1];
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${timestamp}_${randomStr}_${i}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        // 写入文件
        const buffer = Buffer.from(base64Data, 'base64');
        await writeFile(filePath, buffer);

        uploadedUrls.push(`/uploads/${fileName}`);
      } catch (err) {
        errors.push({ index: i, message: '上传失败' });
      }
    }

    res.json({
      success: true,
      data: {
        urls: uploadedUrls,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: '上传失败'
      }
    });
  }
});

export default router;