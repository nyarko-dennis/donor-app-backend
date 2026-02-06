export class CreateDonorDto {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    constituency?: string;
    sub_constituency?: string;
}
