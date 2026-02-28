import { DataSource } from 'typeorm';
import { SubConstituency } from '../constituencies/sub-constituency.entity';
import { Class } from '../classes/class.entity';
import { Donation } from '../donations/donation.entity';
import { Donor } from '../donors/donor.entity';
import { Constituency } from '../constituencies/constituency.entity';
import { Transaction } from '../donations/transaction.entity';
import { DonationCause } from '../donation-causes/donation-cause.entity';
import { Campaign } from '../campaigns/campaign.entity';
import 'dotenv/config';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'donor_user',
    password: process.env.DB_PASSWORD || 'donor_password',
    database: process.env.DB_NAME || 'donor_db',
    entities: [
        SubConstituency,
        Class,
        Donation,
        Donor,
        Constituency,
        Transaction,
        DonationCause,
        Campaign,
    ],
    synchronize: true,
});

async function runMigration() {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const subConstituencyRepo = AppDataSource.getRepository(SubConstituency);
    const classRepo = AppDataSource.getRepository(Class);
    const donationRepo = AppDataSource.getRepository(Donation);
    const donorRepo = AppDataSource.getRepository(Donor);

    // 1. Establish the "True" Sub-Constituencies mapping.
    // Assuming 'Infants', 'Secondary', 'Juniors', 'Lower Secondary', 'Upper Secondary'
    // Or simply, anything that doesn't look like a specific class code.
    const allSubConstituencies = await subConstituencyRepo.find();

    console.log(`Found ${allSubConstituencies.length} rows in sub_constituencies table.`);

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

    console.log(`Identified ${trueSubs.length} true sub-constituencies.`);
    console.log(
        `Identified ${falseSubsAsClasses.length} class rows incorrectly saved as sub-constituencies.`,
    );

    // 2. Loop through the false sub-constituencies (the classes) and migrate them
    let migratedCount = 0;
    for (const falseSub of falseSubsAsClasses) {
        // Determine the true parent sub-constituency based on the class name
        let parentSubName: string | null = null;
        const nameUpper = falseSub.name.toUpperCase();

        if (nameUpper.includes('INFANT')) {
            parentSubName = 'Infants';
        } else if (nameUpper.includes('LOWER SECONDARY')) {
            parentSubName = 'Lower Secondary';
        } else if (nameUpper.includes('UPPER SECONDARY')) {
            parentSubName = 'Upper Secondary';
        } else if (nameUpper.includes('SIXTH FORM')) {
            // Sometimes Sixth form is grouped. If we don't have a specific 'Sixth Form' sub-bucket, maybe Upper Secondary?
            // Let's create 'Sixth Form' if it doesn't exist, as it's a distinct level.
            parentSubName = 'Upper Secondary'; // Fallback
            if (allSubConstituencies.some(v => v.name === 'Sixth Form')) {
                parentSubName = 'Sixth Form';
            }
        } else if (nameUpper.includes('JUNIOR')) {
            parentSubName = 'Juniors';
        }

        if (!parentSubName) {
            console.warn(`Could not map parent for class: ${falseSub.name}. Defaulting to 'Secondary'`);
            parentSubName = 'Secondary';
        }

        let parentSub = trueSubs.find(
            (s) => s.name.toLowerCase() === parentSubName?.toLowerCase(),
        );

        // If parent sub doesn't exist, we must create it securely.
        if (!parentSub) {
            console.log(`Creating missing macro sub-constituency: ${parentSubName}`);
            const newSub = subConstituencyRepo.create({
                name: parentSubName,
                description: 'Created during migration',
                constituency_id: falseSub.constituency_id
            });
            parentSub = await subConstituencyRepo.save(newSub);
            trueSubs.push(parentSub);
        }

        // Create the Class entity
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
            console.log(`Migrated class: ${newClass.name}`);
            migratedCount++;
        }

        // 3. Remap Donations pointing to the old falseSub ID
        // Find donations that used the "Class ID" which was pretending to be a SubConstituency
        const affectedDonations = await donationRepo.find({
            where: { sub_constituency_id: falseSub.id },
        });

        for (const donation of affectedDonations) {
            donation.sub_constituency_id = parentSub.id;
            donation.class_id = newClass.id;
            await donationRepo.save(donation);
        }

        if (affectedDonations.length > 0) {
            console.log(`Remapped ${affectedDonations.length} donations for class ${falseSub.name}`);
        }

        // 4. Remap Donors pointing to the old falseSub ID
        const affectedDonors = await donorRepo.find({
            where: { sub_constituency_id: falseSub.id },
        });

        for (const donor of affectedDonors) {
            donor.sub_constituency_id = parentSub.id;
            donor.class_id = newClass.id;
            // We should also clear the raw string properties to prevent divergence
            donor.sub_constituency = parentSub.name;
            await donorRepo.save(donor);
        }

        // We can now safely delete the false sub-constituency row
        await subConstituencyRepo.delete(falseSub.id);
    }

    console.log(`Migration Complete! Migrated ${migratedCount} classes.`);
    await AppDataSource.destroy();
}

runMigration().catch((error) => console.error(error));
