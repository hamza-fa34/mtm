import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent() {
    const settings = await this.prisma.truckSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      return {
        name: "Molly's Truck",
        slogan: 'Les meilleurs burgers de la ville !',
        tvaEmporter: 5.5,
        tvaPlace: 10,
      };
    }

    return {
      name: settings.name,
      slogan: settings.slogan ?? '',
      tvaEmporter: Number(settings.tvaEmporter),
      tvaPlace: Number(settings.tvaPlace),
    };
  }
}
