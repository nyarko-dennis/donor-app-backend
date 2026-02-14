export interface PaymentDto {
    amount: number;
    email: string;
    currency?: string;
    metadata?: any;
}

export interface InitializationResult {
    status: boolean;
    message: string;
    data?: any;
}

export interface VerificationResult {
    status: boolean;
    message: string;
    data?: any;
}

export interface PaymentProvider {
    initialize(data: PaymentDto): Promise<InitializationResult>;
    verify(reference: string): Promise<VerificationResult>;
    handleWebhook(payload: any, signature: string): Promise<boolean>;
}
