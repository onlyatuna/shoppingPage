//express.d.ts
import { Role } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                role: Role;
            };
        }
    }
}

// This export is necessary to make this file a module
export { };
