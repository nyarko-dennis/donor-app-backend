import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Donor } from '../donors/donor.entity';
import { Constituency } from '../constituencies/constituency.entity';
import { SubConstituency } from '../constituencies/sub-constituency.entity';
import { Class } from '../classes/class.entity';
import { Teacher } from '../teachers/teacher.entity';

// Load environment variables
dotenv.config();

async function migrateSubConstituencies() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'donor_app',
        entities: [
            Donor,
            Constituency,
            SubConstituency,
            Class,
            Teacher
        ],
        synchronize: true, // Sync schema to add new columns to Donor and SubConstituency
    });

    try {
        await dataSource.initialize();
        console.log('Data Source has been initialized!');

        // 1. Get Constituencies
        const studentsConst = await dataSource.getRepository(Constituency).findOneBy({ name: 'Students' });
        const teachersConst = await dataSource.getRepository(Constituency).findOneBy({ name: 'Teaching Staff' });

        if (!studentsConst || !teachersConst) {
            console.error('Critical constituencies not found! Ensure "Students" and "Teaching Staff" exist.');
            return;
        }

        // 2. Migrate Classes -> SubConstituencies (Students)
        console.log('Migrating Classes to SubConstituencies...');
        const classes = await dataSource.getRepository(Class).find();
        for (const cls of classes) {
            let sub = await dataSource.getRepository(SubConstituency).findOneBy({
                name: cls.name,
                constituency_id: studentsConst.id
            });

            if (!sub) {
                sub = dataSource.getRepository(SubConstituency).create({
                    name: cls.name,
                    description: cls.description,
                    order: cls.order,
                    constituency: studentsConst,
                });
                await dataSource.getRepository(SubConstituency).save(sub);
            }
        }

        // 3. Migrate Teachers -> SubConstituencies (Teaching Staff)
        console.log('Migrating Teachers to SubConstituencies...');
        const teachers = await dataSource.getRepository(Teacher).find();
        for (const teacher of teachers) {
            let sub = await dataSource.getRepository(SubConstituency).findOneBy({
                name: teacher.name,
                constituency_id: teachersConst.id
            });

            if (!sub) {
                sub = dataSource.getRepository(SubConstituency).create({
                    name: teacher.name,
                    description: teacher.description,
                    constituency: teachersConst,
                });
                await dataSource.getRepository(SubConstituency).save(sub);
            }
        }

        // 4. Link Donors to Constituencies and SubConstituencies
        console.log('Linking Donors...');
        const donors = await dataSource.getRepository(Donor).find();
        const constituencyCache = new Map<string, Constituency>();
        const subConstituencyCache = new Map<string, SubConstituency>(); // Key: "${constituencyId}-${subName}"

        // Pre-load constituencies
        const allConstituencies = await dataSource.getRepository(Constituency).find();
        allConstituencies.forEach(c => constituencyCache.set(c.name, c));

        // Pre-load sub-constituencies
        const allSubs = await dataSource.getRepository(SubConstituency).find();
        allSubs.forEach(s => subConstituencyCache.set(`${s.constituency_id}-${s.name}`, s));

        for (const donor of donors) {
            let changed = false;

            // Link Constituency
            if (donor.constituency && !donor.constituency_entity) {
                const constEntity = constituencyCache.get(donor.constituency);
                if (constEntity) {
                    donor.constituency_entity = constEntity;
                    changed = true;
                }
            }

            // Link SubConstituency
            if (donor.sub_constituency && !donor.sub_constituency_entity && donor.constituency_entity) {
                // Try to find sub-constituency
                const cacheKey = `${donor.constituency_entity.id}-${donor.sub_constituency}`;
                const subEntity = subConstituencyCache.get(cacheKey);

                if (subEntity) {
                    donor.sub_constituency_entity = subEntity;
                    changed = true;
                } else {
                    // Fallback: Create the sub-constituency if it doesn't exist?
                    // The user's data has "Juniors", "Upper Secondary", etc. which are not in the Class list (which are specific classes).
                    // We should probably create these broad categories as SubConstituencies under "Students".
                    console.log(`Creating missing sub-constituency: ${donor.sub_constituency} for ${donor.constituency}`);

                    const newSub = dataSource.getRepository(SubConstituency).create({
                        name: donor.sub_constituency,
                        constituency: donor.constituency_entity,
                        description: 'Created from donor migration',
                    });
                    await dataSource.getRepository(SubConstituency).save(newSub);

                    // Update cache and link
                    subConstituencyCache.set(cacheKey, newSub);
                    donor.sub_constituency_entity = newSub;
                    changed = true;
                }
            }

            if (changed) {
                await dataSource.getRepository(Donor).save(donor);
            }
        }

        console.log('Migration of sub-constituencies completed successfully!');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await dataSource.destroy();
    }
}

migrateSubConstituencies();
