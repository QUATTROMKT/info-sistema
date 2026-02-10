import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey || !integration.accountId) {
            return NextResponse.json(
                { error: "Meta Ads não configurado.", connected: false },
                { status: 200 }
            );
        }

        const { searchParams } = new URL(request.url);
        const datePreset = searchParams.get("date_preset") || "last_30d";

        const accessToken = integration.apiKey;
        const adAccountId = integration.accountId;

        // Fetch account-level insights (aggregated KPIs)
        const insightsUrl = `https://graph.facebook.com/v21.0/${adAccountId}/insights?fields=spend,impressions,clicks,cpc,cpm,ctr,actions,action_values,cost_per_action_type&date_preset=${datePreset}&access_token=${accessToken}`;

        const response = await fetch(insightsUrl, { cache: "no-store" });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.error?.message || "Erro ao buscar insights.", connected: true },
                { status: 200 }
            );
        }

        const data = await response.json();
        const insights = data.data?.[0] || {};

        const spend = parseFloat(insights.spend || "0");
        const purchaseValue = parseFloat(
            insights.action_values?.find((a: any) => a.action_type === "purchase")?.value || "0"
        );
        const purchases = parseInt(
            insights.actions?.find((a: any) => a.action_type === "purchase")?.value || "0"
        );
        const costPerPurchase = parseFloat(
            insights.cost_per_action_type?.find((a: any) => a.action_type === "purchase")?.value || "0"
        );

        return NextResponse.json({
            connected: true,
            insights: {
                spend: spend.toFixed(2),
                revenue: purchaseValue.toFixed(2),
                roas: spend > 0 ? (purchaseValue / spend).toFixed(2) : "0.00",
                purchases,
                cpa: costPerPurchase.toFixed(2),
                impressions: parseInt(insights.impressions || "0"),
                clicks: parseInt(insights.clicks || "0"),
                ctr: parseFloat(insights.ctr || "0").toFixed(2),
                cpc: parseFloat(insights.cpc || "0").toFixed(2),
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
