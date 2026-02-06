import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config/dist/config.service';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserRole } from '../users/user.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { Donor } from '../donors/donor.entity';
import { Donation } from '../donations/donation.entity';
import { Constituency } from '../constituencies/constituency.entity';
import { Class } from '../classes/class.entity';
import { Teacher } from '../teachers/teacher.entity';

// Load environment variables
dotenv.config();

const EXPORT_DIR = '/Users/Apple/Desktop/development-work/firestore-migration/exported_data';

async function migrate() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'donor_app',
        entities: [
            User,
            Campaign,
            Donor,
            Donation,
            Constituency,
            Class,
            Teacher,
        ],
        synchronize: true, // Be careful with this in production!
    });

    try {
        await dataSource.initialize();
        console.log('Data Source has been initialized!');

        // --- MAPPINGS ---
        const userMap = new Map<string, User>(); // firebaseUid -> User
        const campaignMap = new Map<string, Campaign>(); // uid -> Campaign
        const campaignNameMap = new Map<string, Campaign>(); // name -> Campaign
        const donorMap = new Map<string, Donor>(); // filenameId -> Donor
        // Removed: const constituencyMap = new Map<string, Constituency>();
        // Removed: const classMap = new Map<string, Class>();
        // Removed: const teacherMap = new Map<string, Teacher>();


        // --- 1. CONSTITUENCIES ---
        console.log('Migrating Constituencies...');
        const constituenciesDir = path.join(EXPORT_DIR, 'constituencies');
        if (fs.existsSync(constituenciesDir)) {
            const files = fs.readdirSync(constituenciesDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(constituenciesDir, file), 'utf-8'));
                if (!data.name) continue;

                let constituency = await dataSource.getRepository(Constituency).findOneBy({ name: data.name });
                if (!constituency) {
                    constituency = dataSource.getRepository(Constituency).create({
                        name: data.name,
                    });
                    await dataSource.getRepository(Constituency).save(constituency);
                }
            }
        }

        // --- 2. CLASSES ---
        console.log('Migrating Classes...');
        const classesDir = path.join(EXPORT_DIR, 'classes');
        if (fs.existsSync(classesDir)) {
            const files = fs.readdirSync(classesDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(classesDir, file), 'utf-8'));
                if (!data.name) continue;

                let cls = await dataSource.getRepository(Class).findOneBy({ name: data.name });
                if (!cls) {
                    cls = dataSource.getRepository(Class).create({
                        name: data.name,
                        description: data.description,
                        order: data.order,
                    });
                    await dataSource.getRepository(Class).save(cls);
                }
            }
        }

        // --- 3. TEACHERS ---
        console.log('Migrating Teachers...');
        const teachersDir = path.join(EXPORT_DIR, 'teachers');
        if (fs.existsSync(teachersDir)) {
            const files = fs.readdirSync(teachersDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(teachersDir, file), 'utf-8'));
                if (!data.name) continue;

                // Check by name as we don't strictly use ID here yet
                let teacher = await dataSource.getRepository(Teacher).findOneBy({ name: data.name });
                if (!teacher) {
                    teacher = dataSource.getRepository(Teacher).create({
                        name: data.name,
                        description: data.description,
                    });
                    await dataSource.getRepository(Teacher).save(teacher);
                }
            }
        }

        // --- 4. USERS ---
        console.log('Migrating Users...');
        const usersDir = path.join(EXPORT_DIR, 'users');
        if (fs.existsSync(usersDir)) {
            const files = fs.readdirSync(usersDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(usersDir, file), 'utf-8'));
                if (!data.email) continue;

                let user = await dataSource.getRepository(User).findOneBy({ email: data.email });
                if (!user) {
                    user = dataSource.getRepository(User).create({
                        email: data.email,
                        first_name: data.firstName || 'Unknown',
                        last_name: data.lastName || 'User',
                        password: 'changeMe123!', // Temporary password
                        role: UserRole.STAKEHOLDER, // Default role
                        is_active: true,
                        created_at: convertFirestoreDate(data.createdAt) || new Date(),
                    });
                    await dataSource.getRepository(User).save(user);
                }
                userMap.set(data.firebaseUid || path.basename(file, '.json'), user);
            }
        }

        // --- 5. CAMPAIGNS ---
        console.log('Migrating Campaigns...');
        const campaignsDir = path.join(EXPORT_DIR, 'campaigns');
        if (fs.existsSync(campaignsDir)) {
            const files = fs.readdirSync(campaignsDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(campaignsDir, file), 'utf-8'));

                // Using name as unique identifier if possible, otherwise rely on creation
                // Since we removed firestore_id, we just create. 
                // Ideally we should check if exists by some unique field. Name?
                let campaign = await dataSource.getRepository(Campaign).findOneBy({ name: data.name });
                if (!campaign) {
                    campaign = dataSource.getRepository(Campaign).create({
                        name: data.name,
                        description: data.description,
                        goal_amount: data.goalAmount,
                        target_audience: data.targetAudience, // Truncate if needed? DB limit 100 char.
                        start_date: convertFirestoreDate(data.startDate)?.toISOString().split('T')[0] || undefined,
                        end_date: convertFirestoreDate(data.endDate)?.toISOString().split('T')[0] || undefined,
                        status: data.status,
                        created_at: convertFirestoreDate(data.dateCreated) || new Date(),
                    });
                    await dataSource.getRepository(Campaign).save(campaign);
                }

                if (data.uid) campaignMap.set(data.uid, campaign);
                if (data.name) campaignNameMap.set(data.name, campaign);
            }
        }

        // --- 6. DONORS ---
        console.log('Migrating Donors...');
        const donorsDir = path.join(EXPORT_DIR, 'donors');
        if (fs.existsSync(donorsDir)) {
            const files = fs.readdirSync(donorsDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(donorsDir, file), 'utf-8'));
                if (!data.email) continue;

                let donor = await dataSource.getRepository(Donor).findOneBy({ email: data.email });
                if (!donor) {
                    donor = dataSource.getRepository(Donor).create({
                        first_name: data.firstName || 'Unknown',
                        last_name: data.lastName || 'Donor',
                        email: data.email,
                        phone: data.phone,
                        constituency: data.constituency, // Just string copy
                        sub_constituency: data.subConstituency, // Just string copy
                        date_joined: convertFirestoreDate(data.dateCreated) || new Date(),
                    });
                    await dataSource.getRepository(Donor).save(donor);
                }
                const filenameId = path.basename(file, '.json');
                donorMap.set(filenameId, donor);
            }
        }

        // --- 7. DONATIONS ---
        console.log('Migrating Donations...');
        const donationsDir = path.join(EXPORT_DIR, 'donations');
        if (fs.existsSync(donationsDir)) {
            const files = fs.readdirSync(donationsDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(donationsDir, file), 'utf-8'));

                // Lookup Donor
                // Donor ID might be in 'donatedByUid' -> matches filename of donor JSON
                const donor = donorMap.get(data.donatedByUid);

                // Lookup Campaign
                // Campaign might be in 'campaign' (string name)
                const campaign = campaignNameMap.get(data.campaign);

                const donation = dataSource.getRepository(Donation).create({
                    amount: data.amount,
                    currency: data.currency || 'GHS',
                    payment_method: data.paymentMethod,
                    // donation_cause: data.donationCause, // Column removed
                    donation_date: convertFirestoreDate(data.dateCreated) || new Date(),
                    donor: donor || undefined, // Nullable relationship
                    campaign: campaign || undefined, // Nullable relationship
                });

                await dataSource.getRepository(Donation).save(donation);
            }
        }

        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await dataSource.destroy();
    }
}

// Helper to handle Firestore timestamps
function convertFirestoreDate(dateObj: any): Date | null {
    if (!dateObj) return null;
    if (dateObj instanceof Date) return dateObj;

    // { _seconds: 123, _nanoseconds: 456 }
    if (dateObj._seconds !== undefined) {
        return new Date(dateObj._seconds * 1000);
    }

    // epoch milliseconds number
    if (typeof dateObj === 'number') {
        return new Date(dateObj);
    }

    // String date
    if (typeof dateObj === 'string') {
        return new Date(dateObj);
    }

    return null;
}

migrate();
