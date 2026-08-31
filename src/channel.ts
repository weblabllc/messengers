export interface NotificationMessage {
    to: string;
    text: string;
}

export interface NotificationResult {
    ok: boolean;
    detail?: string;
}

export interface NotificationChannel<C = Record<string, string>> {
    readonly code: string;
    send(message: NotificationMessage, config: C): Promise<NotificationResult>;
}
