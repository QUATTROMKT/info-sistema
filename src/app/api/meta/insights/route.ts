import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json(
                { error: "Meta Ads não configurado.", connected: false },
                { status: 200 }
            );
        }

        const { searchParams } = new URL(request.url);
        const datePreset = searchParams.get("date_preset") || "last_30d";
        const selectedAccountId = searchParams.get("account_id") || "";
        const accessToken = integration.apiKey;

        // Determine which accounts to fetch
        let accountIds: string[] = [];

        if (selectedAccountId && selectedAccountId !== "all") {
            accountIds = [selectedAccountId];
        } else {
            const adAccounts = await prisma.adAccount.findMany({
                where: { integrationId: integration.id, isActive: true },
            });
            if (adAccounts.length > 0) {
                accountIds = adAccounts.map(a => a.accountId);
            } else if (integration.accountId) {
                accountIds = [integration.accountId];
            } else {
                return NextResponse.json({ connected: true, insights: null });
            }
        }

        // Aggregate insights from all accounts
        let totalSpend = 0, totalRevenue = 0, totalPurchases = 0;
        let totalImpressions = 0, totalClicks = 0;
        let totalCpa = 0, cpaCount = 0;

        for (const adAccountId of accountIds) {
            try {
                const insightsUrl = `https://graph.facebook.com/v21.0/${adAccountId}/insights?fields=spend,impressions,clicks,cpc,cpm,ctr,actions,action_values,cost_per_action_type&date_preset=${datePreset}&access_token=${accessToken}`;
                const response = await fetch(insightsUrl, { cache: "no-store" });

                if (response.ok) {
                    const data = await response.json();
                    const insights = data.data?.[0] || {};

                    totalSpend += parseFloat(insights.spend || "0");
                    totalImpressions += parseInt(insights.impressions || "0");
                    totalClicks += parseInt(insights.clicks || "0");

                    const pv = parseFloat(
                        insights.action_values?.find((a: any) => a.action_type === "purchase")?.value || "0"
                    );
                    totalRevenue += pv;
                    totalPurchases += parseInt(
                        insights.actions?.find((a: any) => a.action_type === "purchase")?.value || "0"
                    );
                    const cpp = parseFloat(
                        insights.cost_per_action_type?.find((a: any) => a.action_type === "purchase")?.value || "0"
                    );
                    if (cpp > 0) { totalCpa += cpp; cpaCount++; }
                }
            } catch (err: any) {
                console.error(`[Insights] Error for ${adAccountId}:`, err.message);
            }
        }

        const avgCpa = cpaCount > 0 ? totalCpa / cpaCount : 0;

        return NextResponse.json({
            connected: true,
            insights: {
                spend: totalSpend.toFixed(2),
                revenue: totalRevenue.toFixed(2),
                roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00",
                purchases: totalPurchases,
                cpa: avgCpa.toFixed(2),
                impressions: totalImpressions,
                clicks: totalClicks,
                ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00",
                cpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0.00",
            },
        });
    } catch (error: any) {
        console.error("Meta insights error:", error);
        return NextResponse.json(
            { error: "Erro interno ao buscar insights.", connected: false },
            { status: 500 }
        );
    }
}
