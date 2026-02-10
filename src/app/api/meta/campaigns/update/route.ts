import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Update campaign status or budget
export async function POST(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json({ error: "Meta Ads não configurado." }, { status: 400 });
        }

        const body = await request.json();
        const { campaignId, status, dailyBudget, lifetimeBudget, name } = body;

        if (!campaignId) {
            return NextResponse.json({ error: "Campaign ID é obrigatório." }, { status: 400 });
        }

        const accessToken = integration.apiKey;
        const params = new URLSearchParams({ access_token: accessToken });

        if (status) params.set("status", status);
        if (name) params.set("name", name);
        // Meta API expects budget in cents
        if (dailyBudget !== undefined) params.set("daily_budget", String(Math.round(dailyBudget * 100)));
        if (lifetimeBudget !== undefined) params.set("lifetime_budget", String(Math.round(lifetimeBudget * 100)));

        const response = await fetch(
            `https://graph.facebook.com/v21.0/${campaignId}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            }
        );

        const data = await response.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Campaign update error:", error);
        return NextResponse.json({ error: "Erro ao atualizar campanha." }, { status: 500 });
    }
}
