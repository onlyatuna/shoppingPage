
import { MonitorService } from './apps/backend/src/services/monitor.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMonitoring() {
    console.log('🧪 Starting Monitoring System Test...');

    try {
        // 1. Get initial count
        const initialCount = await prisma.aiUsageLog.count();
        console.log(`Initial Log Count: ${initialCount}`);

        // 2. Find a test user (or create one if needed, but for now assuming ID 1 exists/admin)
        // Actually, let's use a dummy ID or an existing one.
        // We'll try to find any user.
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('❌ No users found in DB. Cannot test logging.');
            return;
        }
        console.log(`Using User ID: ${user.id}`);

        // 3. Simulate Usage
        console.log('📝 Logging test usage...');
        await MonitorService.logUsage(
            user.id,
            'TEST_ACTION',
            'gemini-2.5-flash-lite',
            100, // input tokens
            50   // output tokens
        );

        // 4. Verify Log Created
        const newCount = await prisma.aiUsageLog.count();
        console.log(`New Log Count: ${newCount}`);

        if (newCount !== initialCount + 1) {
            throw new Error('❌ Log count did not increment!');
        }
        console.log('✅ Log entry created successfully.');

        // 5. Verify Stats
        console.log('📊 Fetching daily stats...');
        const stats = await MonitorService.getDailyStats(1);
        console.log('Daily Stats:', JSON.stringify(stats, null, 2));

        // Check if today has data
        const today = new Date().toISOString().split('T')[0];
        const todayStat = stats.find(s => s.date === today);

        if (!todayStat || todayStat.count === 0) {
            throw new Error('❌ Stats for today are missing or empty!');
        }
        console.log('✅ Daily stats verified.');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMonitoring();
