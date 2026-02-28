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
        // 同時輸出到系統日誌
        logger.info({
            action,
            developerId,
            ...details
        }, message);

        // 存入記憶體以供 DevTools 讀取
        logs.unshift({
            timestamp: new Date().toISOString(),
            action,
            developerId,
            message,
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
