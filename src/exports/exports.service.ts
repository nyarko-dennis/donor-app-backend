
import { Injectable, StreamableFile, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Parser } from 'json2csv';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { Donation } from '../donations/donation.entity';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { ExportEntity, ExportFormat, ExportRequestDto, ExportFiltersDto } from './dto/export-request.dto';

@Injectable()
export class ExportsService {
    private readonly logger = new Logger(ExportsService.name);

    constructor(
        @InjectRepository(Donation)
        private donationsRepository: Repository<Donation>,
        @InjectRepository(Donor)
        private donorsRepository: Repository<Donor>,
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
    ) { }

    async exportData(request: ExportRequestDto): Promise<StreamableFile> {
        let data: any[] = [];
        let filename = `export_${request.entity}_${new Date().toISOString()}`;

        switch (request.entity) {
            case ExportEntity.DONATIONS:
                data = await this.getDonations(request.filters);
                break;
            case ExportEntity.DONORS:
                data = await this.getDonors(request.filters);
                break;
            case ExportEntity.CAMPAIGNS:
                data = await this.getCampaigns(request.filters);
                break;
            default:
                throw new BadRequestException('Invalid entity type');
        }

        if (request.format === ExportFormat.XLSX) {
            const buffer = await this.generateXlsx(data, request.columns);
            filename += '.xlsx';
            return new StreamableFile(Buffer.from(buffer), {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: `attachment; filename="${filename}"`,
            });
        } else {
            // Default to CSV
            const csv = this.generateCsv(data, request.columns);
            filename += '.csv';
            return new StreamableFile(Buffer.from(csv), {
                type: 'text/csv',
                disposition: `attachment; filename="${filename}"`,
            });
        }
    }

    private async getDonations(filters?: ExportFiltersDto): Promise<any[]> {
        const queryBuilder = this.donationsRepository.createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.campaign', 'campaign')
            .leftJoinAndSelect('donation.cause', 'cause')
            .leftJoinAndSelect('donation.transaction', 'transaction')
            .leftJoinAndSelect('donation.constituency', 'constituency')
            .leftJoinAndSelect('donation.sub_constituency', 'sub_constituency');

        if (filters) {
            this.applyDonationFilters(queryBuilder, filters);
        }

        const donations = await queryBuilder.getMany();

        return donations.map(d => ({
            'ID': d.id,
            'Amount': d.amount,
            'Currency': d.currency,
            'Donor Name': `${d.donor?.first_name || ''} ${d.donor?.last_name || ''}`.trim(),
            'Donor Email': d.donor?.email,
            'Campaign': d.campaign?.name,
            'Cause': d.cause?.name,
            'Payment Method': d.payment_method,
            'Constituency': d.constituency?.name,
            'Sub-Constituency': d.sub_constituency?.name,
            'Transaction Ref': d.transaction?.reference,
            'Date': d.donation_date,
        }));
    }

    private async getDonors(filters?: ExportFiltersDto): Promise<any[]> {
        const queryBuilder = this.donorsRepository.createQueryBuilder('donor')
            .leftJoinAndSelect('donor.constituency_entity', 'constituency')
            .leftJoinAndSelect('donor.sub_constituency_entity', 'sub_constituency');

        if (filters) {
            this.applyDonorFilters(queryBuilder, filters);
        }

        const donors = await queryBuilder.getMany();

        return donors.map(d => ({
            'ID': d.id,
            'First Name': d.first_name,
            'Last Name': d.last_name,
            'Email': d.email,
            'Phone': d.phone,
            'Constituency': d.constituency || d.constituency_entity?.name,
            'Sub-Constituency': d.sub_constituency || d.sub_constituency_entity?.name,
            'Date Joined': d.date_joined,
        }));
    }

    private async getCampaigns(filters?: ExportFiltersDto): Promise<any[]> {
        const queryBuilder = this.campaignsRepository.createQueryBuilder('campaign');

        // Apply simple filters if any applicable (Campaigns might have fewer filters)
        if (filters?.search) {
            queryBuilder.where('campaign.name ILIKE :search', { search: `%${filters.search}%` });
        }

        const campaigns = await queryBuilder.getMany();

        return campaigns.map(c => ({
            'ID': c.id,
            'Name': c.name,
            'Description': c.description,
            'Target Audience': c.target_audience,
            'Goal Amount': c.goal_amount,
            'Start Date': c.start_date,
            'End Date': c.end_date,
            'Status': c.status,
            'Created At': c.created_at,
        }));
    }

    private applyDonationFilters(qb: SelectQueryBuilder<Donation>, filters: ExportFiltersDto) {
        if (filters.search) {
            qb.andWhere('(donation.payment_method ILIKE :search OR donor.first_name ILIKE :search OR donor.last_name ILIKE :search OR donor.email ILIKE :search)', { search: `%${filters.search}%` });
        }
        if (filters.startDate) {
            qb.andWhere('donation.donation_date >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            qb.andWhere('donation.donation_date <= :endDate', { endDate: filters.endDate });
        }
        if (filters.minAmount) {
            qb.andWhere('donation.amount >= :minAmount', { minAmount: filters.minAmount });
        }
        if (filters.maxAmount) {
            qb.andWhere('donation.amount <= :maxAmount', { maxAmount: filters.maxAmount });
        }
        if (filters.campaignId) {
            qb.andWhere('donation.campaign.id = :campaignId', { campaignId: filters.campaignId });
        }
        if (filters.causeId) {
            qb.andWhere('donation.cause.id = :causeId', { causeId: filters.causeId });
        }
        if (filters.donorId) {
            qb.andWhere('donation.donor.id = :donorId', { donorId: filters.donorId });
        }
        if (filters.constituencyId) {
            qb.andWhere('donation.constituency.id = :constituencyId', { constituencyId: filters.constituencyId });
        }
        if (filters.subConstituencyId) {
            qb.andWhere('donation.sub_constituency.id = :subConstituencyId', { subConstituencyId: filters.subConstituencyId });
        }
    }

    private applyDonorFilters(qb: SelectQueryBuilder<Donor>, filters: ExportFiltersDto) {
        if (filters.search) {
            qb.andWhere('(donor.first_name ILIKE :search OR donor.last_name ILIKE :search OR donor.email ILIKE :search)', { search: `%${filters.search}%` });
        }
        if (filters.constituencyId) {
            qb.andWhere('donor.constituency_id = :constituencyId', { constituencyId: filters.constituencyId });
        }
        if (filters.subConstituencyId) {
            qb.andWhere('donor.sub_constituency_id = :subConstituencyId', { subConstituencyId: filters.subConstituencyId });
        }
        if (filters.startDate) {
            qb.andWhere('donor.date_joined >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            qb.andWhere('donor.date_joined <= :endDate', { endDate: filters.endDate });
        }
    }

    private generateCsv(data: any[], columns?: string[]): string {
        try {
            const parser = new Parser({ fields: columns });
            return parser.parse(data);
        } catch (err) {
            this.logger.error('Error generating CSV', err);
            throw new BadRequestException('Could not generate CSV');
        }
    }

    private async generateXlsx(data: any[], columns?: string[]): Promise<ArrayBuffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Export');

        if (data.length > 0) {
            // Get headers from first row if columns not specified
            const headers = columns || Object.keys(data[0]);
            worksheet.columns = headers.map(header => ({ header, key: header, width: 20 }));

            worksheet.addRows(data);
        }

        return await workbook.xlsx.writeBuffer();
    }
}
