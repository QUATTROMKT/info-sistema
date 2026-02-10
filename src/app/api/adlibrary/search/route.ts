import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json({ error: "Meta Ads não configurado. Vá em Configurações.", connected: false }, { status: 200 });
        }

        const { searchParams } = new URL(request.url);
        const searchTerms = searchParams.get("q") || "";
        const country = searchParams.get("country") || "BR";
        const mediaType = searchParams.get("media_type") || "";
        const activeStatus = searchParams.get("active_status") || "ACTIVE";
        const platform = searchParams.get("platform") || "";
        const language = searchParams.get("language") || "";
        const after = searchParams.get("after") || "";
        const limit = searchParams.get("limit") || "25";

        if (!searchTerms) {
            return NextResponse.json({ error: "Informe um termo de busca.", connected: true }, { status: 200 });
        }

        const accessToken = integration.apiKey;

        // Build the API URL
        const params = new URLSearchParams({
            access_token: accessToken,
            search_terms: searchTerms,
            ad_reached_countries: `["${country}"]`,
            ad_active_status: activeStatus,
            limit,
            fields: "id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,ad_creative_link_descriptions,ad_delivery_start_time,ad_delivery_stop_time,bylines,publisher_platforms,page_id,page_name,ad_snapshot_url,estimated_audience_size,languages,impressions,spend",
        });

        if (mediaType) params.set("media_type", mediaType);
        if (platform) params.set("publisher_platforms", `["${platform}"]`);
        if (language) params.set("languages", `["${language}"]`);
        if (after) params.set("after", after);

        const apiUrl = `https://graph.facebook.com/v21.0/ads_archive?${params.toString()}`;
        const response = await fetch(apiUrl, { cache: "no-store" });

        if (!response.ok) {
            const errData = await response.json();
            console.error("Ad Library API error:", errData);
            return NextResponse.json({
                error: errData.error?.message || "Erro ao buscar anúncios.",
                connected: true,
            }, { status: 200 });
        }

        const data = await response.json();
        const ads = data.data || [];

        // Aggregate page ad counts
        const pageAdCounts: Record<string, number> = {};
        for (const ad of ads) {
            const pid = ad.page_id || ad.page_name || "unknown";
            pageAdCounts[pid] = (pageAdCounts[pid] || 0) + 1;
        }

        // Transform ads
        const transformedAds = ads.map((ad: any) => {
            const startDate = ad.ad_delivery_start_time;
            let daysActive = 0;
            if (startDate) {
                const start = new Date(startDate);
                const now = new Date();
                daysActive = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            }

            return {
                id: ad.id,
                pageId: ad.page_id || null,
                pageName: ad.page_name || "Desconhecido",
                adText: ad.ad_creative_bodies?.[0] || "",
                linkTitle: ad.ad_creative_link_titles?.[0] || "",
                linkCaption: ad.ad_creative_link_captions?.[0] || "",
                linkDescription: ad.ad_creative_link_descriptions?.[0] || "",
                startDate: startDate || null,
                stopDate: ad.ad_delivery_stop_time || null,
                daysActive,
                platforms: ad.publisher_platforms || [],
                snapshotUrl: ad.ad_snapshot_url || null,
                languages: ad.languages || [],
                impressions: ad.impressions || null,
                spend: ad.spend || null,
                pageAdCount: pageAdCounts[ad.page_id || ad.page_name || "unknown"] || 1,
            };
        });

        return NextResponse.json({
            connected: true,
            ads: transformedAds,
            total: transformedAds.length,
            paging: data.paging || null,
        });
    } catch (error: any) {
        console.error("Ad Library search error:", error);
        return NextResponse.json({ error: "Erro interno ao buscar anúncios.", connected: false }, { status: 500 });
    }
}
