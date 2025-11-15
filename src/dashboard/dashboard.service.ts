import { Injectable } from '@nestjs/common';
import { ReportsService } from 'src/modules/reports/reports.service';
import { RequestsService } from 'src/modules/requests/services/requests.service';
import { UsersService } from 'src/modules/users/services/users.service';
import { DashboarPaymentsService } from './payments/payments.service';

@Injectable()
export class DashboardService {
    constructor(
        private readonly userService: UsersService,
        private readonly requestService: RequestsService,
        private readonly  reportsService: ReportsService,
        // private readonly  paymentService: DashboarPaymentsService
    ){}

    async dashboardAnalysis(){
        const {totalUsers, totalClients, totalTechnicians, totalApprovedTechnicians, totalJoiningRequests } = await this.userService.usersAnalysis();
        const {totalRequests} = await this.requestService.requestsAnalysis();
        const totalReports = await this.reportsService.reportsAnalysis();
        // const totalPaymentAmount= await this.paymentService.reportsAnaylsis();

        return{
            totalUsers,
            totalClients,
            totalTechnicians,
            totalApprovedTechnicians,
            totalJoiningRequests,
            totalRequests,
            totalReports
        }
    }
}
