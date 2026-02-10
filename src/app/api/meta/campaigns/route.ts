import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json(
                { error: "Meta Ads não configurado. Vá em Configurações para conectar.", connected: false },
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
            // Get all ad accounts from database
            const adAccounts = await prisma.adAccount.findMany({
                where: { integrationId: integration.id, isActive: true },
            });
            if (adAccounts.length > 0) {
                accountIds = adAccounts.map(a => a.accountId);
            } else if (integration.accountId) {
                accountIds = [integration.accountId];
            } else {
                return NextResponse.json(
                    { error: "Nenhuma conta de anúncios configurada. Adicione em Configurações.", connected: true },
                    { status: 200 }
                );
            }
        }

        // Fetch campaigns from all accounts
        const allCampaigns: any[] = [];

        for (const adAccountId of accountIds) {
            try {
                const campaignsUrl = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}&limit=50`;
                const campaignsResponse = await fetch(campaignsUrl, { cache: "no-store" });

                if (!campaignsResponse.ok) {
                    const error = await campaignsResponse.json();
                    console.error(`[Campaigns] Error for ${adAccountId}:`, error.error?.message);
                    continue;
                }

                const campaignsData = await campaignsResponse.json();
                const campaigns = campaignsData.data || [];

                // Fetch insights for each campaign
                const campaignsWithInsights = await Promise.all(
                    campaigns.map(async (campaign: any) => {
                        try {
                            const insightsUrl = `https://graph.facebook.com/v21.0/${campaign.id}/insights?fields=spend,impressions,clicks,cpc,cpm,ctr,actions,action_values,cost_per_action_type&date_preset=${datePreset}&access_token=${accessToken}`;
                            const insightsRes = await fetch(insightsUrl, { cache: "no-store" });

                            if (insightsRes.ok) {
                                const insightsData = await insightsRes.json();
                                const insights = insightsData.data?.[0] || {};

                                const purchases = insights.actions?.find((a: any) => a.action_type === "purchase")?.value || 0;
                                const purchaseValue = insights.action_values?.find((a: any) => a.action_type === "purchase")?.value || 0;
                                const costPerPurchase = insights.cost_per_action_type?.find((a: any) => a.action_type === "purchase")?.value || 0;

                                const spend = parseFloat(insights.spend || "0");
                                const revenue = parseFloat(purchaseValue);
                                const roas = spend > 0 ? (revenue / spend).toFixed(2) : "0.00";

                                return {
                                    ...campaign,
                                    accountId: adAccountId,
                                    insights: {
                                        spend: spend.toFixed(2),
                                        impressions: parseInt(insights.impressions || "0"),
                                        clicks: parseInt(insights.clicks || "0"),
                                        cpc: parseFloat(insights.cpc || "0").toFixed(2),
                                        cpm: parseFloat(insights.cpm || "0").toFixed(2),
                                        ctr: parseFloat(insights.ctr || "0").toFixed(2),
                                        purchases: parseInt(purchases),
                                        revenue: revenue.toFixed(2),
                                        roas,
                                        cpa: parseFloat(costPerPurchase).toFixed(2),
                                    },
                                };
                            }
                            return { ...campaign, accountId: adAccountId, insights: null };
                        } catch {
                            return { ...campaign, accountId: adAccountId, insights: null };
                        }
                    })
                );

                allCampaigns.push(...campaignsWithInsights);
            } catch (err: any) {
                console.error(`[Campaigns] Fetch error for ${adAccountId}:`, err.message);
            }
        }

        return NextResponse.json({
            connected: true,
            campaigns: allCampaigns,
            total: allCampaigns.length,
        });
    } catch (error: any) {
        console.error("Meta API error:", error);
        return NextResponse.json(
            { error: "Erro interno ao buscar dados da Meta.", connected: false },
            { status: 500 }
        );
    }
}
