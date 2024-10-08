export type DataType<T> = T | null | undefined;
export type HeadersType = {
    "x-client-id": string;
    "x-api-key": string;
    "Content-Type": string;
    "x-partner-code"?: string;
};
export type PayOSResponseType<T> = {
    code: string;
    desc: string;
    data?: DataType<T>;
    signature?: string;
};
export type CheckoutRequestType = {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
    signature?: string;
    items?: {
        name: string;
        quantity: number;
        price: number;
    }[];
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    buyerAddress?: string;
    expiredAt?: number;
};
export type CheckoutResponseDataType = {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    expiredAt?: number;
    checkoutUrl: string;
    qrCode: string;
};
export type CancelPaymentLinkRequestType = {
    cancellationReason?: string;
};
export type ConfirmWebhookRequestType = {
    webhookUrl: string;
};
export type PaymentLinkDataType = {
    id: string;
    orderCode: number;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: string;
    createdAt: string;
    transactions: TransactionType[];
    cancellationReason: string | null;
    canceledAt: string | null;
};
type TransactionType = {
    reference: string;
    amount: number;
    accountNumber: string;
    description: string;
    transactionDateTime: string;
    virtualAccountName: string | null;
    virtualAccountNumber: string | null;
    counterAccountBankId: string | null;
    counterAccountBankName: string | null;
    counterAccountName: string | null;
    counterAccountNumber: string | null;
};
export type WebhookType = {
    code: string;
    desc: string;
    success: boolean;
    data: WebhookDataType;
    signature: string;
};
export type WebhookDataType = {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId?: string | null;
    counterAccountBankName?: string | null;
    counterAccountName?: string | null;
    counterAccountNumber?: string | null;
    virtualAccountName?: string | null;
    virtualAccountNumber?: string | null;
};
export {};
