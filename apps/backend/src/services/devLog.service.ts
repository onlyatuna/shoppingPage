import { logger } from '../utils/logger';

export interface DevLogEntry {
    timestamp: string;
    action: string;
    developerId?: number;
    message: string;
    details?: any;
}

const MAX_LOGS = 50;
const logs: DevLogEntry[] = [];

export class DevLogService {
    static log(action: string, developerId: number | undefined, message: string, details?: any) {
        // Sanitize string inputs to prevent Log Injection (CRLF)
        const safeAction = action ? String(action).replace(/[\r\n]/g, '') : '';
        const safeMessage = message ? String(message).replace(/[\r\n]/g, '') : '';

        // 同時輸出到系統日誌
        logger.info({
            action: safeAction,
            developerId,
            ...details
        }, safeMessage);

        // 存入記憶體以供 DevTools 讀取
        logs.unshift({
            timestamp: new Date().toISOString(),
            action: safeAction,
            developerId,
            message: safeMessage,
            details
        });

        if (logs.length > MAX_LOGS) {
            logs.pop();
        }
    }

    static getRecentLogs(limit: number = 10) {
        return logs.slice(0, limit);
    }
}
