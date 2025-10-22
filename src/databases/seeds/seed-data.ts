import { EntityManager } from "typeorm";
import { NationalityEntity } from "../../modules/nationalties/entities/nationality.entity";
import { ServiceEntity } from "../../modules/services/entities/service.entity";
import { UserStatus, UsersTypes } from "src/common/enums/users.enum";
import { UserEntity } from "src/modules/users/entities/users.entity";
import { TechnicalProfileEntity } from "src/modules/users/entities/technical_profile.entity";
import { ServiceRequestsEntity } from "src/modules/requests/entities/service_requests.entity";
import { RequestStatus } from "src/modules/requests/enums/requestStatus.enum";
import { ReportsEntity } from "src/modules/reports/entities/reports.entity";
import { ReportReason } from "src/modules/reports/enums/reports.enum";

export const seedData = async (manager: EntityManager) => {
    await seedNationalities(manager);
    await seedServices(manager);
    await seedUsers(manager);
    await seedServiceRequests(manager);
    await seedReports(manager); // <--- add call to seed reports
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

async function seedServiceRequests(manager: EntityManager) {
    // Check if requests already exist
    const existingRequests = await manager.find(ServiceRequestsEntity);
    if (existingRequests.length > 0) {
        return;
    }

    console.log('Seeding service requests...');

    // Find sample user and technician created above
    const user1 = await manager.findOne(UserEntity, { where: { username: 'user1' }});
    const tech1 = await manager.findOne(UserEntity, { where: { username: 'فني 1' }});
    const tech2 = await manager.findOne(UserEntity, { where: { username: 'فني 2' }});
    const service1 = await manager.findOne(ServiceEntity, { where: { enName: 'Electricity' }});
    const service2 = await manager.findOne(ServiceEntity, { where: { enName: 'Plumbing' }});

    const requestsToCreate = [];

    if (user1 && service1) {
        requestsToCreate.push({
            title: 'Fix living room lights',
            description: 'Lights in the living room flicker and sometimes go off.',
            latitude: '30.0444',
            longitude: '31.2357',
            arAddress: 'القاهرة، منطقة وسط البلد',
            enAddress: 'Cairo, Downtown',
            status: RequestStatus.IN_PROGRESS,
            price: 120.00,
            requestNumber: 'REQ-SEED-1',
            user: user1,
            services: [service1],
            technician: tech1,
        });

        requestsToCreate.push({
            title: "تصليح كهرباء غرفة المعيشة",
            description: 'الأضواء في غرفة المعيشة تومض وأحيانًا تنطفئ.',
            latitude: '30.0444',
            longitude: '31.2357',
            arAddress: 'القاهرة، منطقة وسط البلد',
            enAddress: 'Cairo, Downtown',
            status: RequestStatus.COMPLETED,
            price: 120.00,
            requestNumber: 'REQ-SEED-152',
            user: user1,
            services: [service1],
            technician: tech2,
        });
        
        requestsToCreate.push({
            title: "تصليح كهرباء غرفة المعيشة",
            description: 'الأضواء في غرفة المعيشة تومض وأحيانًا تنطفئ.',
            latitude: '30.0444',
            longitude: '31.2357',
            arAddress: 'القاهرة، منطقة وسط البلد',
            enAddress: 'Cairo, Downtown',
            status: RequestStatus.COMPLETED,
            price: 120.00,
            requestNumber: 'REQ-SEED-11152',
            user: user1,
            services: [service1],
            technician: tech1,
        });
    }

    if (user1 && tech1 && service2) {
        requestsToCreate.push({
            title: 'Bathroom leak repair',
            description: 'Leak under the sink, needs plumbing fix.',
            latitude: '30.1234',
            longitude: '31.4321',
            arAddress: 'بنها، مصر',
            enAddress: 'Banha, Egypt',
            status: RequestStatus.PENDING,
            price: 250.00,
            requestNumber: 'REQ-SEED-2',
            user: user1,
            technician: tech1,
            services: [service2],
        });

        requestsToCreate.push({
            title: 'Bathroom leak repair',
            description: 'Leak under the sink, needs plumbing fix.',
            latitude: '30.1234',
            longitude: '31.4321',
            arAddress: 'بنها، مصر',
            enAddress: 'Banha, Egypt',
            status: RequestStatus.COMPLETED,
            price: 250.00,
            requestNumber: 'REQ-SEED-322',
            user: user1,
            technician: tech1,
            services: [service2],
        });


        requestsToCreate.push({
            title: 'تسريب في المطبخ',
            description: 'تسريب تحت الحوض، يحتاج إلى تصليح سباكة.',
            latitude: '30.1234',
            longitude: '31.4321',
            arAddress: 'الرياض، السعودية',
            enAddress: 'Riyadh, Saudi',
            status: RequestStatus.IN_PROGRESS,
            price: 250.00,
            requestNumber: 'REQ-SEED-112',
            user: user1,
            technician: tech1,
            services: [service2],
        });

        requestsToCreate.push({
            title: 'تصليح تسريب في الحمام',
            description: 'تسريب تحت الحوض، يحتاج إلى تصليح سباكة.',
            latitude: '30.1234',
            longitude: '31.4321',
            arAddress: 'بنها، مصر',
            enAddress: 'Banha, Egypt',
            status: RequestStatus.PENDING,
            price: 250.00,
            requestNumber: 'REQ-SEED-26500',
            user: user1,
            technician: tech1,
            services: [service2],
        });

        requestsToCreate.push({
            title: 'تصليح تسريب في الحمام',
            description: 'تسريب تحت الحوض، يحتاج إلى تصليح سباكة.',
            latitude: '30.1234',
            longitude: '31.4321',
            arAddress: 'بنها، مصر',
            enAddress: 'Banha, Egypt',
            status: RequestStatus.CANCELLED,
            price: 250.00,
            requestNumber: 'REQ-SEED-2656',
            user: user1,
            technician: tech1,
            services: [service2],
        });
    }

    for (const req of requestsToCreate) {
        const newReq = manager.create(ServiceRequestsEntity, req);
        await manager.save(newReq);
    }

    console.log('Service requests seeded successfully');
}

// New: seed reports
async function seedReports(manager: EntityManager) {
    const existingReports = await manager.find(ReportsEntity);
    if (existingReports.length > 0) {
        return;
    }

    console.log('Seeding reports...');

    // Find sample user, technician and a request created earlier
    const user1 = await manager.findOne(UserEntity, { where: { username: 'user1' }});
    const tech1 = await manager.findOne(UserEntity, { where: { username: 'فني 1' }});
    const req1 = await manager.findOne(ServiceRequestsEntity, { where: { requestNumber: 'REQ-SEED-1' }});

    const reportsToCreate: Partial<ReportsEntity>[] = [];

    if (user1 && tech1 && req1) {
         reportsToCreate.push({
            reportNumber: 'REP-SEED-0',
            type: 'user', // reporter is a user
            reason: ReportReason.unprofessionalBehavior,
            message: 'الفني كان غير محترم ولم يكمل العمل كما هو متفق عليه.',
            reporter: user1,
            reported: tech1,
            request: req1,
            media: []
        });

        reportsToCreate.push({
            reportNumber: 'REP-SEED-1',
            type: 'user', // user reporting technician
            reason: ReportReason.other,
            message: 'Technician arrived late and did not complete the work as agreed.',
            reporter: user1,
            reported: tech1,
            request: req1,
            media: []
        });

        reportsToCreate.push({
            reportNumber: 'REP-SEED-2',
            type: 'user', // user reporting technician
            reason: ReportReason.badQualityWork,
            message: 'Issue with service quality — some parts were left unfinished.',
            reporter: user1,
            reported: tech1,
            request: req1,
            media: []
        });
    }

    // A report filed by the technician about the client
    if (user1 && tech1) {
        reportsToCreate.push({
            reportNumber: 'REP-SEED-3',
            type: 'technician', // technician reporting user
            reason: ReportReason.other,
            message: 'العميل كان مسيئًا أثناء الزيارة.',
            reporter: tech1,
            reported: user1,
            media: []
        });
    }

    for (const rep of reportsToCreate) {
        const newRep = manager.create(ReportsEntity, rep);
        await manager.save(newRep);
    }

    console.log('Reports seeded successfully');
}