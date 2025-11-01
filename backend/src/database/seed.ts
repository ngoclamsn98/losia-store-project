import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { USER_LEVELS } from '../common/constants/user-levels.constant';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User],
  synchronize: false,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    // Check if superadmin already exists
    const existingSuperAdmin = await userRepository.findOne({
      where: { email: 'superadmin@losia.com' },
    });

    if (existingSuperAdmin) {
      await AppDataSource.destroy();
      return;
    }

    // Create superadmin
    const hashedPassword = await bcrypt.hash('G7v!xP9#qR2u$Lm8@tZ1wK4&', 10);

    const superAdmin = userRepository.create({
      email: 'superadmin@losia.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPERADMIN,
      level: USER_LEVELS.SUPERADMIN,
      isActive: true,
    });

    await userRepository.save(superAdmin);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();

