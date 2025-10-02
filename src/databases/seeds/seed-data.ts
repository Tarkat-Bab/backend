import { EntityManager } from "typeorm";
import { NationalityEntity } from "../../modules/nationalties/entities/nationality.entity";
import { ServiceEntity } from "../../modules/services/entities/service.entity";

export const seedData = async (manager: EntityManager) => {
    await seedNationalities(manager);
    await seedServices(manager);
}

async function seedNationalities(manager: EntityManager) {
    const nationalities = [
        { arName: 'سعودي', enName: 'Saudi' },
        { arName: 'مصري', enName: 'Egyptian' },
        { arName: 'إماراتي', enName: 'Emirati' },
        { arName: 'كويتي', enName: 'Kuwaiti' },
        { arName: 'قطري', enName: 'Qatari' },
        { arName: 'عماني', enName: 'Omani' },
        { arName: 'بحريني', enName: 'Bahraini' },
        { arName: 'أردني', enName: 'Jordanian' },
        { arName: 'لبناني', enName: 'Lebanese' },
        { arName: 'فلسطيني', enName: 'Palestinian' },
        { arName: 'سوري', enName: 'Syrian' },
        { arName: 'عراقي', enName: 'Iraqi' },
        { arName: 'يمني', enName: 'Yemeni' },
        { arName: 'سوداني', enName: 'Sudanese' },
        { arName: 'ليبي', enName: 'Libyan' },
        { arName: 'تونسي', enName: 'Tunisian' },
        { arName: 'جزائري', enName: 'Algerian' },
        { arName: 'مغربي', enName: 'Moroccan' },
    ];

    // Check if nationalities already exist
    const existingNationalities = await manager.find(NationalityEntity);
    
    if (existingNationalities.length === 0) {
        console.log('Seeding nationalities...');
        
        for (const nationality of nationalities) {
            const newNationality = manager.create(NationalityEntity, nationality);
            await manager.save(newNationality);
        }
        
        console.log('Nationalities seeded successfully');
    }
}

async function seedServices(manager: EntityManager) {
    const services = [
        { arName: 'الكهرباء', enName: 'Electricity' },
        { arName: 'السباكة', enName: 'Plumbing' },
        { arName: 'التكييف', enName: 'Air Conditioning' },
        { arName: 'تنظيف خزانات', enName: 'Water Tank Cleaning' },
        { arName: 'كاميرات أمنية', enName: 'Security Cameras' },
        { arName: 'حدادة', enName: 'Blacksmithing' },
        { arName: 'دهان', enName: 'Painting' },
        { arName: 'نجارة', enName: 'Carpentry' },
        { arName: 'نظافة المنزل', enName: 'House Cleaning' },
        { arName: 'خدمات الأثاث', enName: 'Furniture Services' }
    ];

    // Check if services already exist
    const existingServices = await manager.find(ServiceEntity);
    
    if (existingServices.length === 0) {
        console.log('Seeding services...');
        
        for (const service of services) {
            const newService = manager.create(ServiceEntity, service);
            await manager.save(newService);
        }
        
        console.log('Services seeded successfully');
    }
}