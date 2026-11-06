import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Repository } from 'typeorm';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { OrderPhoto } from './entities/order-photo.entity';
import { Order } from './entities/order.entity';

const MAX_PHOTOS_PER_ORDER = 10;

// Cek jenis file dari isinya (bukan dari nama atau ekstensi yang bisa dipalsukan)
function detectType(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

@Injectable()
export class PhotosService {
  // Folder penyimpanan. Bisa diganti lewat UPLOAD_DIR di .env.
  private readonly root: string;

  constructor(
    @InjectRepository(OrderPhoto) private readonly photos: Repository<OrderPhoto>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    config: ConfigService,
  ) {
    this.root = config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
  }

  private pathOf(orderId: string, fileName: string) {
    return join(this.root, orderId, fileName);
  }

  private toView(p: OrderPhoto) {
    return {
      id: p.id,
      kind: p.kind,
      caption: p.caption,
      originalName: p.originalName,
      mimeType: p.mimeType,
      size: p.size,
      createdAt: p.createdAt,
    };
  }

  async list(orderId: string) {
    const order = await this.orders.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Order tidak ditemukan');

    const rows = await this.photos.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'ASC' },
    });
    return { max: MAX_PHOTOS_PER_ORDER, photos: rows.map((p) => this.toView(p)) };
  }

  async upload(
    orderId: string,
    file: Express.Multer.File | undefined,
    dto: UploadPhotoDto,
  ) {
    const order = await this.orders.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (!file) throw new BadRequestException('Foto belum dipilih');

    const type = detectType(file.buffer);
    if (!type) {
      throw new BadRequestException('Format foto harus JPEG, PNG, atau WebP');
    }

    const count = await this.photos.count({ where: { order: { id: orderId } } });
    if (count >= MAX_PHOTOS_PER_ORDER) {
      throw new BadRequestException(
        `Satu order maksimal ${MAX_PHOTOS_PER_ORDER} foto. Hapus foto lama dulu.`,
      );
    }

    const fileName = `${randomUUID()}.${type.ext}`;
    await mkdir(join(this.root, orderId), { recursive: true });
    await writeFile(this.pathOf(orderId, fileName), file.buffer);

    try {
      const photo = this.photos.create({
        order,
        fileName,
        originalName: basename(file.originalname).slice(0, 200),
        mimeType: type.mime,
        size: file.size,
        kind: dto.kind,
        caption: dto.caption?.trim() || null,
      });
      return this.toView(await this.photos.save(photo));
    } catch (err) {
      // Kalau gagal tersimpan di database, jangan tinggalkan file yatim di disk
      await rm(this.pathOf(orderId, fileName), { force: true });
      throw err;
    }
  }

  // Menyiapkan aliran file untuk dilihat atau diunduh
  async open(orderId: string, photoId: string) {
    const photo = await this.photos.findOne({
      where: { id: photoId, order: { id: orderId } },
    });
    if (!photo) throw new NotFoundException('Foto tidak ditemukan');

    const path = this.pathOf(orderId, photo.fileName);
    try {
      await stat(path);
    } catch {
      throw new NotFoundException('File foto hilang dari penyimpanan');
    }

    const ext = photo.fileName.split('.').pop();
    return {
      mime: photo.mimeType,
      downloadName: `foto-${photo.kind}-${photo.id.slice(0, 8)}.${ext}`,
      stream: createReadStream(path),
    };
  }

  async remove(orderId: string, photoId: string) {
    const photo = await this.photos.findOne({
      where: { id: photoId, order: { id: orderId } },
    });
    if (!photo) throw new NotFoundException('Foto tidak ditemukan');

    await rm(this.pathOf(orderId, photo.fileName), { force: true });
    await this.photos.remove(photo);
    return this.list(orderId);
  }
}