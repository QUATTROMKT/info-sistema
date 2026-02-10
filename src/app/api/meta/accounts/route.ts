import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration) {
            return NextResponse.json({ accounts: [] });
        }

        const adAccounts = await prisma.adAccount.findMany({
            where: { integrationId: integration.id, isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, accountId: true },
        });

        // If no ad accounts in DB but has legacy accountId, include it
        if (adAccounts.length === 0 && integration.accountId) {
            return NextResponse.json({
                accounts: [{ id: "legacy", name: "Conta Padrão", accountId: integration.accountId }],
            });
        }

        return NextResponse.json({ accounts: adAccounts });
    } catch (error: any) {
        console.error("Ad accounts error:", error);
        return NextResponse.json({ accounts: [] });
    }
}
