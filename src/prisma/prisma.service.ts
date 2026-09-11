import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn(
        '⚠️ DATABASE_URL not set - Prisma will fail to connect. Set DATABASE_URL in .env',
      );
    }

    const adapter = new PrismaNeon({
      connectionString: connectionString ?? 'postgresql://user:password@localhost:5432/blog',
    });

    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'], // Enable Prisma logs
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma connected with Neon');
    } catch (err) {
      console.error('❌ Prisma failed to connect:', err);
    }

    // Log ALL Prisma runtime errors
    (this as any).$on('error', (e) => {
      console.error('🔥 PRISMA ERROR:', e);
    });

    (this as any).$on('info', (e) => {
      console.info('ℹ️ PRISMA INFO:', e);
    });

    (this as any).$on('warn', (e) => {
      console.warn('⚠️ PRISMA WARNING:', e);
    });

    (this as any).$on('query', (e) => {
      console.log('📄 PRISMA QUERY:', e.query);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
