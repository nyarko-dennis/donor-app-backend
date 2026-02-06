export interface PaymentDto {
    amount: number;
    email: string;
    currency?: string;
    metadata?: any;
}

export interface PaymentResponse {
    status: boolean;
    message: string;
    data?: any;
}

export interface PaymentStrategy {
    initiatePayment(data: PaymentDto): Promise<PaymentResponse>;
    verifyPayment(reference: string): Promise<PaymentResponse>;
}
