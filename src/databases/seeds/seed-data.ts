import { EntityManager } from "typeorm";
import { NationalityEntity } from "../../modules/nationalties/entities/nationality.entity";
import { ServiceEntity } from "../../modules/services/entities/service.entity";
import { UserStatus, UsersTypes } from "src/common/enums/users.enum";
import { UserEntity } from "src/modules/users/entities/users.entity";
import { TechnicalProfileEntity } from "src/modules/users/entities/technical_profile.entity";

export const seedData = async (manager: EntityManager) => {
    await seedNationalities(manager);
    await seedServices(manager);
    await seedUsers(manager);
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
        { 
            arName: 'الكهرباء',
            enName: 'Electricity',
            icone: 'electricity.png'
         },
        { arName: 'السباكة', enName: 'Plumbing', icone: 'plumbing.png' },
        { arName: 'التكييف', enName: 'Air Conditioning', icone: 'ac.png' },
        { arName: 'تنظيف خزانات', enName: 'Water Tank Cleaning', icone: 'tank_cleaning.png' },
        { arName: 'كاميرات أمنية', enName: 'Security Cameras', icone: 'security_cameras.png' },
        { arName: 'حدادة', enName: 'Blacksmithing', icone: 'blacksmithing.png' },
        { arName: 'دهان', enName: 'Painting', icone: 'painting.png' },
        { arName: 'نجارة', enName: 'Carpentry', icone: 'carpentry.png' },
        { arName: 'نظافة المنزل', enName: 'House Cleaning', icone: 'house_cleaning.png' },
        { arName: 'خدمات الأثاث', enName: 'Furniture Services', icone: 'furniture_services.png' }
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


async function  seedUsers(manager: EntityManager) {
    const users = [
        {
            username: 'user1',
            phone: '01223113123',
            email: null,
            status: UserStatus.ACTIVE,
            type: UsersTypes.USER,
            arAddress: 'القاهرة مصر',
            enAddress:'Cairo, Egypt',
            technicalProfile: null
       },{
            username: 'user2',
            phone: '01003113123',
            email: null,
            status: UserStatus.BLOCKED,
            type: UsersTypes.USER,
            arAddress: 'القاهرة مصر',
            enAddress:'Cairo, Egypt',
            technicalProfile: null
       },{
            username: 'user3',
            phone: '01110113123',
            email: null,
            status: UserStatus.ACTIVE,
            type: UsersTypes.USER,
            arAddress: 'القاهرة مصر',
            enAddress:'Cairo, Egypt',
            technicalProfile: null
       },{
            username: 'user4',
            phone: '01121209831',
            email: null,
            status: UserStatus.UNVERIFIED,
            type: UsersTypes.USER,
            arAddress: 'بنها مصر',
            enAddress:'Banha, Egypt',
            technicalProfile: null
       },{
            username: 'user5',
            phone: '01023111800',
            email: null,
            status: UserStatus.ACTIVE,
            type: UsersTypes.USER,
            arAddress: 'الاسكندرية مصر',
            enAddress:'ِAlex, Egypt',
            technicalProfile: null
       },
        {
            username: 'فني 1',
            phone: '01029991800',
            email: null,
            status: UserStatus.ACTIVE,
            type: UsersTypes.TECHNICAL,
            arAddress: 'الاسكندرية مصر',
            enAddress:'ِAlex, Egypt',
       },
        {
            username: 'فني 2',
            phone: '01023111890',
            email: null,
            status: UserStatus.ACTIVE,
            type: UsersTypes.TECHNICAL,
            arAddress: 'القاهرة مصر',
            enAddress:'Cairo, Egypt',
            technicalProfile: null
       },
    ]

    const existingUsers = await manager.find(UserEntity);
    
    if (existingUsers.length === 0) {
        console.log('Seeding users...');
        
        for (const user of users) {
            const newUser = manager.create(UserEntity, user);
            if(newUser.type == UsersTypes.TECHNICAL){
                const techincian = await manager.create(TechnicalProfileEntity, {
                    user: newUser,
                    description: 'فني  خبره 4 سنين',
                    nationality: {id: 2},
                    avgRating: 4,
                    services: [{id:2}]
                    
                })
              await manager.save(techincian);

            }
            await manager.save(newUser);
        }
        
        console.log('Users seeded successfully');
    }
}