import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey || !integration.accountId) {
            return NextResponse.json({ error: "Meta Ads não configurado.", connected: false }, { status: 200 });
        }

        const { searchParams } = new URL(request.url);
        const datePreset = searchParams.get("date_preset") || "last_30d";
        const campaignId = searchParams.get("campaign_id");

        const accessToken = integration.apiKey;
        const adAccountId = integration.accountId;

        // If campaign_id is provided, fetch ad sets for that campaign
        const parentId = campaignId || adAccountId;
        const endpoint = campaignId
            ? `https://graph.facebook.com/v21.0/${campaignId}/adsets`
            : `https://graph.facebook.com/v21.0/${adAccountId}/adsets`;

        const adSetsUrl = `${endpoint}?fields=id,name,status,daily_budget,lifetime_budget,campaign_id,targeting,optimization_goal,bid_strategy&access_token=${accessToken}&limit=100`;

        const response = await fetch(adSetsUrl, { cache: "no-store" });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.error?.message || "Erro ao buscar conjuntos." }, { status: 200 });
        }

        const adSetsData = await response.json();
        const adSets = adSetsData.data || [];

        // Fetch insights for each ad set
        const adSetsWithInsights = await Promise.all(
            adSets.map(async (adSet: any) => {
                try {
                    const insightsUrl = `https://graph.facebook.com/v21.0/${adSet.id}/insights?fields=spend,impressions,clicks,cpc,ctr,actions,action_values,cost_per_action_type&date_preset=${datePreset}&access_token=${accessToken}`;
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
                            ...adSet,
                            daily_budget: adSet.daily_budget ? parseInt(adSet.daily_budget) / 100 : null,
                            lifetime_budget: adSet.lifetime_budget ? parseInt(adSet.lifetime_budget) / 100 : null,
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
                    return { ...adSet, insights: null };
                } catch {
                    return { ...adSet, insights: null };
                }
            })
        );

        return NextResponse.json({ connected: true, adSets: adSetsWithInsights, total: adSets.length });
    } catch (error: any) {
        console.error("Ad Sets API error:", error);
        return NextResponse.json({ error: "Erro interno.", connected: false }, { status: 500 });
    }
}

// POST: Update ad set status or budget
export async function POST(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json({ error: "Meta Ads não configurado." }, { status: 400 });
        }

        const body = await request.json();
        const { adSetId, status, dailyBudget } = body;

        if (!adSetId) {
            return NextResponse.json({ error: "Ad Set ID é obrigatório." }, { status: 400 });
        }

        const params = new URLSearchParams({ access_token: integration.apiKey });
        if (status) params.set("status", status);
        if (dailyBudget !== undefined) params.set("daily_budget", String(Math.round(dailyBudget * 100)));

        const response = await fetch(`https://graph.facebook.com/v21.0/${adSetId}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const data = await response.json();
        if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao atualizar conjunto." }, { status: 500 });
    }
}
