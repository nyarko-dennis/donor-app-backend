import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Donation } from '../donations/donation.entity';
import { DonationCause } from '../donation-causes/donation-cause.entity';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { User } from '../users/user.entity';
import { Constituency } from '../constituencies/constituency.entity';
import { Class } from '../classes/class.entity';
import { Teacher } from '../teachers/teacher.entity';

// Load environment variables
dotenv.config();

async function migrateCauses() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'donor_app',
        entities: [
            Donation,
            DonationCause,
            Donor,
            Campaign,
            User,
            Constituency,
            Class,
            Teacher
        ],
        synchronize: true, // Don't sync schema here, assume app has done it or we do partial
    });

    try {
        await dataSource.initialize();
        console.log('Data Source has been initialized!');

        /*
        // 1. Get all distinct donation causes
        const donations = await dataSource.getRepository(Donation).find();
        const uniqueCauses = new Set(donations.map(d => d.donation_cause).filter(c => c)); // Filter nulls

        console.log(`Found ${uniqueCauses.size} unique causes.`);

        // 2. Create DonationCause entities
        const causesMap = new Map<string, DonationCause>();

        for (const causeName of uniqueCauses) {
            let cause = await dataSource.getRepository(DonationCause).findOneBy({ name: causeName });
            if (!cause) {
                console.log(`Creating cause: ${causeName}`);
                cause = dataSource.getRepository(DonationCause).create({
                    name: causeName,
                    description: `Migrated cause: ${causeName}`
                });
                await dataSource.getRepository(DonationCause).save(cause);
            }
            causesMap.set(causeName, cause);
        }

        // 3. Link Donations to DonationCauses
        console.log('Linking donations...');
        for (const donation of donations) {
            if (donation.donation_cause && causesMap.has(donation.donation_cause)) {
                // Only update if not already linked (though overwrite is fine too)
                if (!donation.cause) {
                    donation.cause = causesMap.get(donation.donation_cause)!;
                    await dataSource.getRepository(Donation).save(donation);
                }
            }
        }
        */
        console.log('Migration script is obsolete after column removal.');

        console.log('Migration of causes completed successfully!');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await dataSource.destroy();
    }
}

migrateCauses();
