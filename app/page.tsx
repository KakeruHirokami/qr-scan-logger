"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  visits: number;
}

interface Stats {
  totalCount: number;
  chartData: ChartData[];
}

export default function Home() {
  const [visitorNumber, setVisitorNumber] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const recordVisit = async () => {
      // セッションで既に記録済みかチェック
      const recorded = sessionStorage.getItem("visit_recorded");
      if (recorded) {
        // 統計情報のみ取得
        const statsRes = await fetch("/api/visit");
        const statsData = await statsRes.json();
        setStats(statsData);
        setVisitorNumber(statsData.totalCount);
        setIsLoading(false);
        return;
      }

      try {
        // 訪問を記録
        const visitRes = await fetch("/api/visit", { method: "POST" });
        const visitData = await visitRes.json();
        // 訪問フラグをセット（何人目かの古い値を保存しない）
        sessionStorage.setItem("visit_recorded", "true");

        // 統計情報を取得し、最新の総数を表示
        const statsRes = await fetch("/api/visit");
        const statsData = await statsRes.json();
        setStats(statsData);
        setVisitorNumber(statsData.totalCount);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    recordVisit();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sky-200 text-lg font-medium tracking-wide">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 relative overflow-hidden">
      {/* 背景の装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* メインカード */}
        <div className="w-full max-w-2xl">
          {/* 訪問者番号 */}
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-sky-300 text-lg md:text-xl font-medium mb-4 tracking-widest uppercase">
              Welcome
            </p>
            <h1 className="text-white text-4xl md:text-6xl font-bold mb-6 leading-tight">
              あなたは
              <span className="block mt-2">
                <span className="inline-block bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent text-6xl md:text-8xl font-black tabular-nums">
                  {visitorNumber?.toLocaleString()}
                </span>
                <span className="text-3xl md:text-5xl ml-2">人目</span>
              </span>
              <span className="block mt-2">の訪問者です</span>
            </h1>
            <p className="text-sky-200/60 text-sm md:text-base">
              QRコードをスキャンしていただきありがとうございます
            </p>
            <p className="text-sky-200/60 text-sm md:text-base">
              この看板の広告効果を測定しています
            </p>
          </div>

          {/* 統計カード */}
          {stats && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">
                  📊 過去7日間の訪問統計
                </h2>
                <div className="text-right">
                  <p className="text-sky-300 text-sm">累計訪問者数</p>
                  <p className="text-white text-2xl font-bold">
                    {stats.totalCount.toLocaleString()}
                    <span className="text-sky-300 text-sm ml-1">人</span>
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#60a5fa", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      tick={{ fill: "#60a5fa", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      }}
                      labelStyle={{ color: "#bfdbfe", fontWeight: "bold" }}
                      itemStyle={{ color: "#93c5fd" }}
                      formatter={(value) => [`${value ?? 0}人`, "訪問者数"]}
                    />
                    <Bar
                      dataKey="visits"
                      fill="url(#colorGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* フッター */}
          <p className="text-center text-sky-300/40 text-xs mt-8">
            Powered by KakeruHirokami
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
