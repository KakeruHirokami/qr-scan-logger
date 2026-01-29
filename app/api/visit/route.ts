import { prisma } from "@/lib/prisma";
import type { Visit } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// IPアドレスを取得するヘルパー関数
function getClientIP(request: NextRequest): string {
  // Vercel/Cloudflare等のプロキシ経由の場合
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // Cloudflare
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  // Vercel
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

// 訪問を記録して訪問者番号を返す
export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress = getClientIP(request);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 同一IP・同日のアクセスがあるかチェック
    const existingVisit = await (prisma.visit as any).findFirst({
      where: {
        ipAddress,
        visitDate: today,
      },
    });

    let isNewVisit = false;
    
    if (!existingVisit) {
      // 新しい訪問を記録
      await prisma.visit.create({
        // 型のズレでコンパイルエラーになる環境があるためanyで回避
        data: { ipAddress, visitDate: today, userAgent } as any,
      });
      isNewVisit = true;
    }

    // 総訪問者数を取得（この訪問者が何人目か）
    const totalCount = await prisma.visit.count();

    // この訪問者の順番を取得（最初の訪問時の順番）
    const visitorRank = existingVisit
      ? await prisma.visit.count({
          where: { id: { lte: existingVisit.id } },
        })
      : totalCount;

    return NextResponse.json({
      visitorNumber: visitorRank,
      totalCount,
      isNewVisit,
    });
  } catch (error) {
    console.error("Failed to record visit:", error);
    return NextResponse.json(
      { error: "Failed to record visit" },
      { status: 500 }
    );
  }
}

// 統計情報を取得
export async function GET() {
  try {
    const totalCount = await prisma.visit.count();

    // 過去7日間の日別訪問数を取得
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const visits: Pick<Visit, "visitedAt">[] = await prisma.visit.findMany({
      where: {
        visitedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        visitedAt: true,
      },
      orderBy: {
        visitedAt: "asc",
      },
    });

    // 日別に集計
    const dailyStats: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      dailyStats[dateStr] = 0;
    }

    visits.forEach((visit) => {
      const dateStr = visit.visitedAt.toISOString().split("T")[0];
      if (dailyStats[dateStr] !== undefined) {
        dailyStats[dateStr]++;
      }
    });

    const chartData = Object.entries(dailyStats).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      }),
      visits: count,
    }));

    return NextResponse.json({
      totalCount,
      chartData,
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
