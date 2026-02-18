
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

        return donations.map(d => {
            const dateObj = d.donation_date ? new Date(d.donation_date) : null;
            return {
                'Amount': d.amount,
                'Currency': d.currency,
                'Donor Name': `${d.donor?.first_name || ''} ${d.donor?.last_name || ''}`.trim(),
                'Donor Email': d.donor?.email,
                'Campaign': d.campaign?.name,
                'Cause': d.cause?.name,
                'Payment Method': d.payment_method,
                'Constituency': d.constituency?.name,
                'Sub-Constituency': d.sub_constituency?.name,
                'Date': dateObj ? dateObj.toISOString().split('T')[0] : '',
                'Time': dateObj ? dateObj.toISOString().split('T')[1].split('.')[0] : '',
            };
        });
    }

    private async getDonors(filters?: ExportFiltersDto): Promise<any[]> {
        const queryBuilder = this.donorsRepository.createQueryBuilder('donor')
            .leftJoinAndSelect('donor.constituency_entity', 'constituency')
            .leftJoinAndSelect('donor.sub_constituency_entity', 'sub_constituency');

        if (filters) {
            this.applyDonorFilters(queryBuilder, filters);
        }

        const donors = await queryBuilder.getMany();

        return donors.map(d => {
            const dateObj = d.date_joined ? new Date(d.date_joined) : null;
            return {
                'First Name': d.first_name,
                'Last Name': d.last_name,
                'Email': d.email,
                'Phone': d.phone,
                'Constituency': d.constituency || d.constituency_entity?.name,
                'Sub-Constituency': d.sub_constituency || d.sub_constituency_entity?.name,
                'Date Joined': dateObj ? dateObj.toISOString().split('T')[0] : '',
                'Time Joined': dateObj ? dateObj.toISOString().split('T')[1].split('.')[0] : '',
            };
        });
    }

    private async getCampaigns(filters?: ExportFiltersDto): Promise<any[]> {
        const queryBuilder = this.campaignsRepository.createQueryBuilder('campaign');

        // Apply simple filters if any applicable (Campaigns might have fewer filters)
        if (filters?.search) {
            queryBuilder.where('campaign.name ILIKE :search', { search: `%${filters.search}%` });
        }

        const campaigns = await queryBuilder.getMany();

        return campaigns.map(c => {
            const createdAt = c.created_at ? new Date(c.created_at) : null;
            return {
                'Name': c.name,
                'Description': c.description,
                'Target Audience': c.target_audience,
                'Goal Amount': c.goal_amount,
                'Start Date': c.start_date,
                'End Date': c.end_date,
                'Status': c.status,
                'Created Date': createdAt ? createdAt.toISOString().split('T')[0] : '',
                'Created Time': createdAt ? createdAt.toISOString().split('T')[1].split('.')[0] : '',
            };
        });
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
            if (Array.isArray(filters.campaignId)) {
                qb.andWhere('donation.campaign.id IN (:...campaignIds)', { campaignIds: filters.campaignId });
            } else {
                qb.andWhere('donation.campaign.id = :campaignId', { campaignId: filters.campaignId });
            }
        }
        if (filters.causeId) {
            if (Array.isArray(filters.causeId)) {
                qb.andWhere('donation.cause.id IN (:...causeIds)', { causeIds: filters.causeId });
            } else {
                qb.andWhere('donation.cause.id = :causeId', { causeId: filters.causeId });
            }
        }
        if (filters.donorId) {
            if (Array.isArray(filters.donorId)) {
                qb.andWhere('donation.donor.id IN (:...donorIds)', { donorIds: filters.donorId });
            } else {
                qb.andWhere('donation.donor.id = :donorId', { donorId: filters.donorId });
            }
        }
        if (filters.constituencyId) {
            if (Array.isArray(filters.constituencyId)) {
                qb.andWhere('donation.constituency.id IN (:...constituencyIds)', { constituencyIds: filters.constituencyId });
            } else {
                qb.andWhere('donation.constituency.id = :constituencyId', { constituencyId: filters.constituencyId });
            }
        }
        if (filters.subConstituencyId) {
            if (Array.isArray(filters.subConstituencyId)) {
                qb.andWhere('donation.sub_constituency.id IN (:...subConstituencyIds)', { subConstituencyIds: filters.subConstituencyId });
            } else {
                qb.andWhere('donation.sub_constituency.id = :subConstituencyId', { subConstituencyId: filters.subConstituencyId });
            }
        }
    }

    private applyDonorFilters(qb: SelectQueryBuilder<Donor>, filters: ExportFiltersDto) {
        if (filters.search) {
            qb.andWhere('(donor.first_name ILIKE :search OR donor.last_name ILIKE :search OR donor.email ILIKE :search)', { search: `%${filters.search}%` });
        }
        if (filters.constituencyId) {
            if (Array.isArray(filters.constituencyId)) {
                qb.andWhere('donor.constituency_id IN (:...constituencyIds)', { constituencyIds: filters.constituencyId });
            } else {
                qb.andWhere('donor.constituency_id = :constituencyId', { constituencyId: filters.constituencyId });
            }
        }
        if (filters.subConstituencyId) {
            if (Array.isArray(filters.subConstituencyId)) {
                qb.andWhere('donor.sub_constituency_id IN (:...subConstituencyIds)', { subConstituencyIds: filters.subConstituencyId });
            } else {
                qb.andWhere('donor.sub_constituency_id = :subConstituencyId', { subConstituencyId: filters.subConstituencyId });
            }
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
