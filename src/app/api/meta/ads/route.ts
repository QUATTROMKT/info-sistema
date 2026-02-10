import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json({ error: "Meta Ads não configurado.", connected: false }, { status: 200 });
        }

        const { searchParams } = new URL(request.url);
        const datePreset = searchParams.get("date_preset") || "last_30d";
        const adSetId = searchParams.get("adset_id");
        const selectedAccountId = searchParams.get("account_id") || "";
        const accessToken = integration.apiKey;

        // Determine which accounts to fetch
        let accountIds: string[] = [];

        if (adSetId) {
            accountIds = ["__adset__"];
        } else if (selectedAccountId && selectedAccountId !== "all") {
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
                return NextResponse.json({ connected: true, ads: [], total: 0 });
            }
        }

        const allAds: any[] = [];

        for (const acctId of accountIds) {
            try {
                let endpoint: string;
                if (adSetId) {
                    endpoint = `https://graph.facebook.com/v21.0/${adSetId}/ads`;
                } else {
                    endpoint = `https://graph.facebook.com/v21.0/${acctId}/ads`;
                }

                const adsUrl = `${endpoint}?fields=id,name,status,creative{id,thumbnail_url,effective_object_story_id},adset_id,campaign_id&access_token=${accessToken}&limit=100`;
                const response = await fetch(adsUrl, { cache: "no-store" });

                if (!response.ok) {
                    const error = await response.json();
                    console.error(`[Ads] Error for ${acctId}:`, error.error?.message);
                    continue;
                }

                const adsData = await response.json();
                const ads = adsData.data || [];

                const adsWithInsights = await Promise.all(
                    ads.map(async (ad: any) => {
                        try {
                            const insightsUrl = `https://graph.facebook.com/v21.0/${ad.id}/insights?fields=spend,impressions,clicks,cpc,ctr,actions,action_values,cost_per_action_type&date_preset=${datePreset}&access_token=${accessToken}`;
                            const insightsRes = await fetch(insightsUrl, { cache: "no-store" });

                            if (insightsRes.ok) {
                                const insightsData = await insightsRes.json();
                                const insights = insightsData.data?.[0] || {};

                                const purchases = insights.actions?.find((a: any) => a.action_type === "purchase")?.value || 0;
                                const purchaseValue = insights.action_values?.find((a: any) => a.action_type === "purchase")?.value || 0;
                                const costPerPurchase = insights.cost_per_action_type?.find((a: any) => a.action_type === "purchase")?.value || 0;
                                const spend = parseFloat(insights.spend || "0");
                                const revenue = parseFloat(purchaseValue);

                                return {
                                    ...ad,
                                    insights: {
                                        spend: spend.toFixed(2),
                                        impressions: parseInt(insights.impressions || "0"),
                                        clicks: parseInt(insights.clicks || "0"),
                                        cpc: parseFloat(insights.cpc || "0").toFixed(2),
                                        ctr: parseFloat(insights.ctr || "0").toFixed(2),
                                        purchases: parseInt(purchases),
                                        revenue: revenue.toFixed(2),
                                        roas: spend > 0 ? (revenue / spend).toFixed(2) : "0.00",
                                        cpa: parseFloat(costPerPurchase).toFixed(2),
                                    },
                                };
                            }
                            return { ...ad, insights: null };
                        } catch {
                            return { ...ad, insights: null };
                        }
                    })
                );

                allAds.push(...adsWithInsights);
            } catch (err: any) {
                console.error(`[Ads] Fetch error for ${acctId}:`, err.message);
            }

            if (adSetId) break;
        }

        return NextResponse.json({ connected: true, ads: allAds, total: allAds.length });
    } catch (error: any) {
        console.error("Ads API error:", error);
        return NextResponse.json({ error: "Erro interno.", connected: false }, { status: 500 });
    }
}

// POST: Update ad status
export async function POST(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json({ error: "Meta Ads não configurado." }, { status: 400 });
        }

        const body = await request.json();
        const { adId, status } = body;

        if (!adId) {
            return NextResponse.json({ error: "Ad ID é obrigatório." }, { status: 400 });
        }

        const params = new URLSearchParams({ access_token: integration.apiKey });
        if (status) params.set("status", status);

        const response = await fetch(`https://graph.facebook.com/v21.0/${adId}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const data = await response.json();
        if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao atualizar anúncio." }, { status: 500 });
    }
}
