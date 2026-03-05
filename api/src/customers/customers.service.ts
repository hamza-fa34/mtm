import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      orderBy: [{ name: 'asc' }],
    });

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? undefined,
      loyaltyPoints: customer.loyaltyPoints,
      lastVisit: customer.lastVisitAt
        ? customer.lastVisitAt.getTime()
        : undefined,
    }));
  }
}
