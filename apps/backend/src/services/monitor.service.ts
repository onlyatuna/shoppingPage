import { prisma } from '../utils/prisma'; // [FIXED] Use singleton

// const prisma = new PrismaClient(); // [REMOVED]

// Gemini 2.5 Flash Pricing (Sample, check official for updates)
// Input: $0.075 / 1M tokens
// Output: $0.30 / 1M tokens
// < 128k context
const PRICING = {
    'gemini-2.5-flash-lite': {
        input: 0.075 / 1_000_000,
        output: 0.30 / 1_000_000
    },
    'default': { // Fallback
        input: 0.10 / 1_000_000,
        output: 0.40 / 1_000_000
    }
};

const DAILY_COST_LIMIT = parseFloat(process.env.AI_DAILY_COST_LIMIT || '5.0'); // $5.00 default

export class MonitorService {

    /**
     * Log AI usage and calculate estimated cost
     */
    static async logUsage(
        userId: number,
        action: string,
        model: string,
        inputTokens: number,
        outputTokens: number
    ) {
        try {
            const pricing = PRICING[model as keyof typeof PRICING] || PRICING.default;
            const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);

            await prisma.aiUsageLog.create({
                data: {
                    userId,
                    action,
                    model,
                    inputTokens,
                    outputTokens,
                    cost
                }
            });

            // Check if we exceeded the daily budget
            await this.checkDailyBudget();

        } catch (error) {
            console.error('Failed to log AI usage:', error);
            // Don't throw, we don't want to fail the user request just because logging failed
        }
    }

    /**
     * Check if today's total cost exceeds limit
     */
    private static async checkDailyBudget() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = await prisma.aiUsageLog.aggregate({
                _sum: {
                    cost: true
                },
                where: {
                    createdAt: {
                        gte: today
                    }
                }
            });

            const totalCost = Number(result._sum.cost || 0);

            if (totalCost > DAILY_COST_LIMIT) {
                console.warn(`🚨 DAILY AI COST ALERT: $${totalCost.toFixed(4)} exceeds limit of $${DAILY_COST_LIMIT}`);
                // In a real app, send email/Slack notification here
            }

        } catch (error) {
            console.error('Failed to check daily budget:', error);
        }
    }

    /**
     * Get daily statistics for the last N days
     */
    static async getDailyStats(days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await prisma.aiUsageLog.findMany({
            where: {
                createdAt: {
                    gte: startDate
                }
            },
            select: {
                createdAt: true,
                cost: true,
                action: true
            }
        });

        // Group by day
        const stats: Record<string, { count: number, cost: number }> = {};

        logs.forEach(log => {
            const date = log.createdAt.toISOString().split('T')[0];
            if (!stats[date]) {
                stats[date] = { count: 0, cost: 0 };
            }
            stats[date].count++;
            stats[date].cost += Number(log.cost);
        });

        // Fill in missing days
        const result = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            result.push({
                date: dateStr,
                count: stats[dateStr]?.count || 0,
                cost: stats[dateStr]?.cost || 0
            });
        }

        return result.reverse();
    }
}
