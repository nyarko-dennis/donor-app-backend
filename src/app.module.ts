import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampaignsModule } from './campaigns/campaigns.module';
import { DonorsModule } from './donors/donors.module';
import { DonationsModule } from './donations/donations.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PaymentModule } from './payment/payment.module';
import { DonationCausesModule } from './donation-causes/donation-causes.module';
import { ConstituenciesModule } from './constituencies/constituencies.module';
import { ClassesModule } from './classes/classes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QueueModule } from './queue/queue.module';
import { ExportsModule } from './exports/exports.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SubConstituency } from './constituencies/sub-constituency.entity';
import { Class } from './classes/class.entity';
import { Donation } from './donations/donation.entity';
import { Donor } from './donors/donor.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        //const isProduction = configService.get('NODE_ENV') === 'production';
        //const dbSsl = configService.get('DB_SSL') === 'true';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // Auto-create tables (dev only)
          ssl: { rejectUnauthorized: false },
        };
      },
      inject: [ConfigService],
    }),
    CampaignsModule,
    DonorsModule,
    DonationsModule,
    AuthModule,
    UsersModule,
    PaymentModule,
    DonationCausesModule,
    ConstituenciesModule,
    ClassesModule,
    DashboardModule,
    QueueModule,
    ExportsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private dataSource: DataSource) { }

  async onModuleInit() {
    this.logger.log('Running bootstrapping routines...');
    await this.runClassDataMigration();
  }

  private async runClassDataMigration() {
    try {
      const subConstituencyRepo = this.dataSource.getRepository(SubConstituency);
      const classRepo = this.dataSource.getRepository(Class);
      const donationRepo = this.dataSource.getRepository(Donation);
      const donorRepo = this.dataSource.getRepository(Donor);

      const allSubConstituencies = await subConstituencyRepo.find();
      if (allSubConstituencies.length === 0) return;

      const trueSubConstituencyNames = [
        'Infants',
        'Secondary',
        'Juniors',
        'Lower Secondary',
        'Upper Secondary',
      ];

      const trueSubs = allSubConstituencies.filter((sub) =>
        trueSubConstituencyNames.includes(sub.name),
      );

      const falseSubsAsClasses = allSubConstituencies.filter(
        (sub) => !trueSubConstituencyNames.includes(sub.name),
      );

      if (falseSubsAsClasses.length === 0) {
        this.logger.log('Classes data migration already complete or not required.');
        return;
      }

      this.logger.log(`Found ${falseSubsAsClasses.length} class rows incorrectly saved as sub-constituencies. Migrating...`);

      let migratedCount = 0;
      for (const falseSub of falseSubsAsClasses) {
        let parentSubName: string | null = null;
        const nameUpper = falseSub.name.toUpperCase();

        if (nameUpper.includes('INFANT')) {
          parentSubName = 'Infants';
        } else if (nameUpper.includes('LOWER SECONDARY')) {
          parentSubName = 'Lower Secondary';
        } else if (nameUpper.includes('UPPER SECONDARY')) {
          parentSubName = 'Upper Secondary';
        } else if (nameUpper.includes('SIXTH FORM')) {
          parentSubName = 'Upper Secondary';
          if (allSubConstituencies.some((v) => v.name === 'Sixth Form')) {
            parentSubName = 'Sixth Form';
          }
        } else if (nameUpper.includes('JUNIOR')) {
          parentSubName = 'Juniors';
        }

        if (!parentSubName) {
          parentSubName = 'Secondary';
        }

        let parentSub = trueSubs.find(
          (s) => s.name.toLowerCase() === parentSubName?.toLowerCase(),
        );

        if (!parentSub) {
          const newSub = subConstituencyRepo.create({
            name: parentSubName,
            description: 'Created during migration',
            constituency_id: falseSub.constituency_id,
          });
          parentSub = await subConstituencyRepo.save(newSub);
          trueSubs.push(parentSub);
        }

        const existingClass = await classRepo.findOneBy({ name: falseSub.name });
        let newClass = existingClass;

        if (!newClass) {
          newClass = classRepo.create({
            name: falseSub.name,
            description: falseSub.description,
            order: falseSub.order,
            sub_constituency_id: parentSub.id,
          });
          newClass = await classRepo.save(newClass);
          migratedCount++;
        }

        const affectedDonations = await donationRepo.find({
          where: { sub_constituency_id: falseSub.id },
        });

        for (const donation of affectedDonations) {
          donation.sub_constituency_id = parentSub.id;
          donation.class_id = newClass.id;
          await donationRepo.save(donation);
        }

        const affectedDonors = await donorRepo.find({
          where: { sub_constituency_id: falseSub.id },
        });

        for (const donor of affectedDonors) {
          donor.sub_constituency_id = parentSub.id;
          donor.class_id = newClass.id;
          donor.sub_constituency = parentSub.name;
          await donorRepo.save(donor);
        }

        await subConstituencyRepo.delete(falseSub.id);
      }

      this.logger.log(`Migration Complete! Migrated ${migratedCount} classes safely into the Classes table.`);
    } catch (error) {
      this.logger.error(`Error during class data migration boot hook: ${error.message}`, error.stack);
    }
  }
}
