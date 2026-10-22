import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  create(dto: CreateCustomerDto) {
    return this.repo.save(this.repo.create(dto));
  }

  // Cari berdasarkan nama ATAU nomor telepon
  findAll(search?: string) {
    return this.repo.find({
      where: search
        ? [{ name: ILike(`%${search}%`) }, { phone: ILike(`%${search}%`) }]
        : {},
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const customer = await this.repo.findOneBy({ id });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    try {
      await this.repo.remove(customer);
    } catch (err) {
      // Kode 23503 = pelanggan masih dipakai tabel lain (order)
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string })?.code === '23503'
      ) {
        throw new ConflictException(
          'Pelanggan ini masih punya order, jadi tidak bisa dihapus',
        );
      }
      throw err;
    }
    return { message: 'Pelanggan dihapus' };
  }
}