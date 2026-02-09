import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';

// Load environment variables
dotenv.config();

async function createAdminUsers() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'donor_app',
        entities: [User],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('Data Source has been initialized!');

        const usersRepo = dataSource.getRepository(User);
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('changeMe123!', salt);

        // 1. Create/Update Super Admin
        const superAdminEmail = 'superadmin@gis.edu.gh';
        let superAdmin = await usersRepo.findOneBy({ email: superAdminEmail });

        if (!superAdmin) {
            superAdmin = usersRepo.create({
                email: superAdminEmail,
                password: hashedPassword,
                first_name: 'Super',
                last_name: 'Admin',
                role: UserRole.SUPER_ADMIN,
                is_active: true,
            });
            await usersRepo.save(superAdmin);
            console.log(`Created Super Admin: ${superAdminEmail}`);
        } else {
            // Update password just in case it was plain text
            superAdmin.password = hashedPassword;
            await usersRepo.save(superAdmin);
            console.log(`Updated Super Admin password: ${superAdminEmail}`);
        }

        // 2. Create/Update Admin
        const adminEmail = 'admin@gis.edu.gh';
        let admin = await usersRepo.findOneBy({ email: adminEmail });

        if (!admin) {
            admin = usersRepo.create({
                email: adminEmail,
                password: hashedPassword,
                first_name: 'Admin',
                last_name: 'User',
                role: UserRole.ADMIN,
                is_active: true,
            });
            await usersRepo.save(admin);
            console.log(`Created Admin: ${adminEmail}`);
        } else {
            // Update password just in case it was plain text
            admin.password = hashedPassword;
            await usersRepo.save(admin);
            console.log(`Updated Admin password: ${adminEmail}`);
        }

    } catch (error) {
        console.error('Error creating admin users:', error);
    } finally {
        await dataSource.destroy();
    }
}

createAdminUsers();
