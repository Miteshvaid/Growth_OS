import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getAnalytics } from "../api/analytics";
import Navbar from "../components/Navbar";
import AnimatedNumber from "../components/AnimatedNumber";

const COLORS = ["#7c3aed", "#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];

const ACTIVITY_EMOJIS = {
  Studying: "📚",
  Coding: "💻",
  Distracted: "😵",
  Break: "☕",
  Other: "📝",
};

const FOCUS_LABELS = {
  5: "🔥 Peak",
  4: "😊 Good",
  3: "😐 Okay",
  2: "😕 Low",
  1: "😞 Poor",
};

function CalendarHeatmap({ data }) {
  const weeks = [];
  const today = new Date();
  const daysData = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayData = data.find((item) => item.date === dateStr);
    daysData.push({
      date: dateStr,
      count: dayData?.count || 0,
      avgFocus: dayData?.avgFocus || 0,
    });
  }

  for (let i = 0; i < daysData.length; i += 7) {
    weeks.push(daysData.slice(i, i + 7));
  }

  const activeDays = daysData.filter((d) => d.count > 0).length;
  const totalCheckinsLogged = daysData.reduce((acc, d) => acc + d.count, 0);

  const getIntensity = (count, avgFocus) => {
    if (count === 0) return "bg-white/5";
    const score = count * (avgFocus || 1);
    if (score < 3) return "bg-accent/20";
    if (score < 6) return "bg-accent/40";
    if (score < 10) return "bg-accent/60";
    return "bg-accent";
  };

  return (
    <div className="bg-ink-light border border-white/5 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-cream font-medium text-sm">
            Focus Activity Heatmap (Last 90 Days)
          </h3>
          <p className="text-muted text-xs mt-0.5">
            Consistency tracking over time
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs bg-ink px-3 py-1.5 rounded-xl border border-white/5">
          <div>
            <span className="text-muted">Active Days: </span>
            <span className="text-emerald-400 font-semibold">{activeDays} / 90</span>
          </div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div>
            <span className="text-muted">Total Logs: </span>
            <span className="text-accent font-semibold">{totalCheckinsLogged}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        <div className="flex gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} check-ins | Avg Focus: ${day.avgFocus || 0}`}
                  className={`w-3.5 h-3.5 rounded-sm ${getIntensity(day.count, day.avgFocus)} transition-all hover:ring-1 hover:ring-white/40 cursor-pointer`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5" />
            <div className="w-3 h-3 rounded-sm bg-accent/20" />
            <div className="w-3 h-3 rounded-sm bg-accent/40" />
            <div className="w-3 h-3 rounded-sm bg-accent/60" />
            <div className="w-3 h-3 rounded-sm bg-accent" />
          </div>
          <span>More</span>
        </div>
        <span className="text-[11px] text-muted/70">Each block represents 1 day</span>
      </div>
    </div>
  );
}

function InsightCard({ title, value, subtitle, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-accent/10 to-accent-light/5 border border-accent/20 rounded-2xl p-5"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="text-cream font-medium text-sm mb-1">{title}</h4>
      <p className="font-display text-xl text-cream mb-1">{value}</p>
      <p className="text-muted text-xs">{subtitle}</p>
    </motion.div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(30);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(null); // null | 'csv' | 'pdf'
  const reportRef = useRef(null);
  const exportDropdownRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      if (!data) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const res = await getAnalytics(dateRange);
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
        if (!cancelled) setError("Failed to load analytics. Please retry.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CSV Export
  const handleExportCSV = () => {
    if (!data) return;
    setExporting("csv");
    try {
      const { summary, trends, breakdown } = data;
      const { focus = [], tasks = [] } = trends || {};
      const { activities = {} } = breakdown || {};

      let csv = "GROWTH OS - PRODUCTIVITY & FOCUS ANALYTICS REPORT\n";
      csv += `Generated At,${new Date().toISOString()}\n`;
      csv += `Period,${dateRange === 0 ? "All Time" : `${dateRange} Days`}\n\n`;

      csv += "=== SUMMARY KPIS ===\n";
      csv += "Metric,Value\n";
      csv += `Total Check-ins,${summary?.totalCheckins || 0}\n`;
      csv += `Average Focus Rating,${summary?.avgFocus || 0} / 5\n`;
      csv += `Current Focus Streak,${summary?.currentStreak || 0} Days\n`;
      csv += `Max Focus Streak,${summary?.maxStreak || 0} Days\n`;
      csv += `Total Notes,${summary?.totalNotes || 0}\n`;
      csv += `Total Tasks,${summary?.totalTasks || 0}\n`;
      csv += `Completed Tasks,${summary?.completedTasks || 0}\n`;
      csv += `Task Completion Rate,${summary?.completionRate || 0}%\n\n`;

      csv += "=== ACTIVITY BREAKDOWN ===\n";
      csv += "Activity,Sessions Logged\n";
      Object.entries(activities).forEach(([act, count]) => {
        csv += `"${act}",${count}\n`;
      });
      csv += "\n";

      csv += "=== FOCUS SESSIONS (DAILY TREND) ===\n";
      csv += "Date,Average Focus Rating,Check-in Count\n";
      focus.forEach((f) => {
        csv += `${f.date},${f.avgFocus},${f.count || 1}\n`;
      });
      csv += "\n";

      csv += "=== TASK METRICS (DAILY TREND) ===\n";
      csv += "Date,Tasks Created,Tasks Completed\n";
      tasks.forEach((t) => {
        csv += `${t.date},${t.total},${t.completed}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Growth_OS_Analytics_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Export error:", err);
      alert("Failed to generate CSV export");
    } finally {
      setExporting(null);
      setShowExportMenu(false);
    }
  };

  // PDF Export
  //   const handleExportPDF = async () => {
  //     if (!reportRef.current) return;
  //     setExporting("pdf");
  //     try {
  //       const element = reportRef.current;

  //       ///////
  //       const pdfStyle = document.createElement("style");

  //       pdfStyle.id = "pdf-export-style";

  //       pdfStyle.innerHTML = `
  //   #pdf-export-target,
  //   #pdf-export-target * {
  //     color: #f4f3f8 !important;
  //     background-image: none !important;
  //   }

  //   #pdf-export-target {
  //     background-color: #11121b !important;
  //   }
  // `;

  //       document.head.appendChild(pdfStyle);
  //       element.setAttribute("id", "pdf-export-target");
  //       //////
  //       const canvas = await html2canvas(element, {
  //         scale: 2,
  //         useCORS: true,
  //         backgroundColor: "#11121b",
  //         logging: false,
  //       });

  //       const imgData = canvas.toDataURL("image/png");

  //       const pdf = new jsPDF({
  //         orientation: "portrait",
  //         unit: "px",
  //         format: [canvas.width, canvas.height],
  //       });

  //       pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  //       pdf.save(
  //         `Growth_OS_Analytics_${new Date().toISOString().split("T")[0]}.pdf`,
  //       );
  //     } catch (err) {
  //       console.error("PDF Export error:", err);
  //       alert("Failed to generate PDF export");
  //     } finally {
  //       setExporting(null);
  //       setShowExportMenu(false);
  //     }
  //   };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting("pdf");

    const element = reportRef.current;

    try {
      // Temporarily inject print/pdf friendly standard colors & styles
      const pdfStyle = document.createElement("style");
      pdfStyle.id = "pdf-export-style";
      pdfStyle.innerHTML = `
        #pdf-export-target {
          background-color: #11121b !important;
          color: #f4f3f8 !important;
          padding: 24px !important;
          border-radius: 16px !important;
          width: 900px !important;
        }
        #pdf-export-target * {
          box-shadow: none !important;
          text-shadow: none !important;
        }
      `;

      document.head.appendChild(pdfStyle);
      element.setAttribute("id", "pdf-export-target");

      // Wait briefly for DOM style adjustments
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#11121b",
        logging: false,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 40; // 20pt margin left and right
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 20;

      // First page
      pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 40;

      // Add pages if content exceeds A4 single page height
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 20;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 40;
      }

      pdf.save(
        `Growth_OS_Analytics_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Failed to generate PDF export: " + (err.message || err));
    } finally {
      element.removeAttribute("id");
      document.getElementById("pdf-export-style")?.remove();
      setExporting(null);
      setShowExportMenu(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="max-w-md mx-auto text-center py-20 px-4">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-muted mb-6">
            {error || "Error loading analytics"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent hover:bg-accent-light text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, trends, breakdown, sessionHistory } = data;
  const { focus, tasks } = trends || {};
  const { activities } = breakdown || {};

  const insights = [];

  if (activities && Object.keys(activities).length > 0) {
    const topActivity = Object.entries(activities).sort(
      (a, b) => b[1] - a[1],
    )[0];
    insights.push({
      title: "Top Activity",
      value: `${ACTIVITY_EMOJIS[topActivity[0]] || "📝"} ${topActivity[0]}`,
      subtitle: `${topActivity[1]} sessions logged`,
      icon: "🎯",
    });
  }

  if (focus && focus.length > 0) {
    const bestDay = focus.reduce((max, d) =>
      d.avgFocus > max.avgFocus ? d : max,
    );
    insights.push({
      title: "Best Focus Day",
      value: bestDay.date.slice(5),
      subtitle: `Avg Focus: ${bestDay.avgFocus}/5`,
      icon: "⭐",
    });
  }

  if (summary?.completionRate > 0) {
    insights.push({
      title: "Task Completion",
      value: `${summary.completionRate}%`,
      subtitle: `${summary.completedTasks}/${summary.totalTasks} tasks done`,
      icon: "✅",
    });
  }

  const heatmapData = (focus || []).map((f) => ({
    date: f.date,
    count: f.count || 1,
    avgFocus: f.avgFocus,
  }));

  const activityDistribution = activities
    ? Object.entries(activities).map(([tag, count]) => ({ tag, count }))
    : [];

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <Link
            to="/dashboard"
            className="text-muted text-sm hover:text-accent"
          >
            ← Dashboard
          </Link>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-8">
            <h1 className="font-display text-3xl text-cream flex items-center gap-3">
              Focus Analytics
              {refreshing && (
                <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              )}
            </h1>

            <div className="flex items-center gap-3">
              {/* Date Range Picker */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {[7, 30, 90, 0].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      dateRange === range
                        ? "bg-accent text-white"
                        : "text-muted hover:text-cream"
                    }`}
                  >
                    {range === 0 ? "All" : `${range}d`}
                  </button>
                ))}
              </div>

              {/* Export Dropdown */}
              <div className="relative" ref={exportDropdownRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting !== null}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-cream text-xs font-medium px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                  {exporting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <span>📥 Export</span>
                      <svg
                        className={`w-3.5 h-3.5 text-muted transition-transform ${
                          showExportMenu ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-ink-light border border-white/10 rounded-xl shadow-xl shadow-black/30 p-1.5 z-40"
                    >
                      <button
                        onClick={handleExportPDF}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-cream/90 hover:text-cream hover:bg-white/5 rounded-lg text-left transition-colors"
                      >
                        <span>📄</span>
                        <div>
                          <p className="font-medium">Download PDF</p>
                          <p className="text-[10px] text-muted">
                            Formatted Visual Report
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-cream/90 hover:text-cream hover:bg-white/5 rounded-lg text-left transition-colors"
                      >
                        <span>📊</span>
                        <div>
                          <p className="font-medium">Download CSV</p>
                          <p className="text-[10px] text-muted">
                            Raw Data & Trends
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Report Container (captured for PDF export) */}
          <div
            ref={reportRef}
            data-pdf-report="true"
            className="space-y-8 rounded-2xl"
          >
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Check-ins"
                value={summary?.totalCheckins || 0}
                delay={0}
              />
              <StatCard
                label="Focus Days"
                value={
                  summary?.totalCheckins
                    ? [...new Set(focus?.map((f) => f.date))].length
                    : 0
                }
                delay={0.05}
              />
              <StatCard
                label="Current Streak"
                value={summary?.currentStreak || 0}
                suffix="d"
                delay={0.1}
              />
              <StatCard
                label="Avg Focus"
                value={summary?.avgFocus || 0}
                suffix="/5"
                delay={0.15}
              />
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, i) => (
                  <InsightCard key={i} {...insight} />
                ))}
              </div>
            )}

            {/* Heatmap */}
            <div>
              <CalendarHeatmap data={heatmapData} />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-5">
              <ChartCard title="Focus Rating Trend" delay={0.2}>
                {!focus || focus.length === 0 ? (
                  <EmptyState message="No focus check-ins yet" />
                ) : (
                  <div>
                    <ResponsiveContainer width="100%" height={210}>
                      <AreaChart data={focus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient
                            id="focusGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis
                          domain={[1, 5]}
                          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                          ticks={[1, 2, 3, 4, 5]}
                          tickFormatter={(val) => {
                            const ems = { 5: "🔥5", 4: "😊4", 3: "😐3", 2: "😕2", 1: "😞1" };
                            return ems[val] || val;
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-ink-light)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "12px",
                            color: "var(--text-cream)",
                          }}
                          formatter={(value, name, item) => [
                            `${FOCUS_LABELS[Math.round(value)] || "⭐"} ${value}/5 (${item.payload.activities?.join(", ") || "Focus Session"})`,
                            "Avg Focus",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="avgFocus"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fill="url(#focusGradient)"
                          dot={{ r: 4, fill: "#818cf8", stroke: "#4f46e5", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: "#34d399" }}
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Detailed Rating Breakdown Data with Times */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      <p className="text-[11px] font-medium text-muted mb-2">Detailed Focus Activity Log:</p>
                      {sessionHistory && sessionHistory.length > 0 ? (
                        sessionHistory.slice().reverse().map((sess, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-ink px-3 py-2 rounded-xl text-xs border border-white/5">
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="text-cream font-medium flex items-center gap-1.5 truncate">
                                <span>{sess.emoji || ACTIVITY_EMOJIS[sess.activityType] || "⚡"}</span>
                                <span>{sess.activityType}</span>
                              </span>
                              <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                                <span>📅 {sess.date}</span>
                                <span>•</span>
                                <span>⏰ {sess.startTime} {sess.endTime ? `- ${sess.endTime}` : ''}</span>
                              </span>
                            </div>
                            <span className="text-amber-400 font-semibold text-xs shrink-0">
                              {FOCUS_LABELS[sess.focusRating] || "⭐"} {sess.focusRating}/5
                            </span>
                          </div>
                        ))
                      ) : (
                        focus.slice().reverse().map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-ink px-3 py-1.5 rounded-lg text-xs">
                            <span className="text-muted text-[11px]">📅 {item.date}</span>
                            <span className="text-cream font-medium truncate max-w-[120px]">
                              {item.activities?.length ? item.activities.join(", ") : "Focus Session"}
                            </span>
                            <span className="text-amber-400 font-semibold">
                              {FOCUS_LABELS[Math.round(item.avgFocus)] || "⭐"} {item.avgFocus}/5
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Task Completion" delay={0.25}>
                {!tasks || tasks.length === 0 ? (
                  <EmptyState message="No tasks tracked yet" />
                ) : (
                  <div>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={tasks}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis
                          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-ink-light)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "12px",
                            color: "var(--text-cream)",
                          }}
                        />
                        <Bar
                          dataKey="completed"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          name="Completed"
                          animationDuration={800}
                        />
                        <Bar
                          dataKey="total"
                          fill="#4f46e5"
                          radius={[4, 4, 0, 0]}
                          name="Total"
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Detailed Task Completion Data */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      <p className="text-[11px] font-medium text-muted mb-2">Daily Task Data:</p>
                      {tasks.slice().reverse().map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-ink px-3 py-1.5 rounded-lg text-xs border border-white/5">
                          <span className="text-muted text-[11px]">📅 {item.date}</span>
                          <span className="text-emerald-400 font-medium">
                            {item.completed} / {item.total} Completed
                          </span>
                          <span className="text-indigo-400 font-medium">
                            {item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0}% Rate
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Focus Activities Data" delay={0.3}>
                {activityDistribution.length === 0 ? (
                  <EmptyState message="No activities logged yet" />
                ) : (
                  <div>
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={activityDistribution}
                          dataKey="count"
                          nameKey="tag"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ tag, count }) =>
                            `${ACTIVITY_EMOJIS[tag] || "📝"} ${tag} (${count})`
                          }
                          animationDuration={800}
                        >
                          {activityDistribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-ink-light)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "12px",
                            color: "var(--text-cream)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Detailed Activity Distribution Table with Recent Session Timestamps */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      <p className="text-[11px] font-medium text-muted mb-2">Activities Timeline & Sessions Log:</p>
                      {sessionHistory && sessionHistory.length > 0 ? (
                        sessionHistory.slice().reverse().map((sess, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-ink px-3 py-1.5 rounded-lg text-xs border border-white/5">
                            <span className="text-cream font-medium flex items-center gap-1.5 truncate">
                              <span>{sess.emoji || ACTIVITY_EMOJIS[sess.activityType] || "📝"}</span>
                              <span>{sess.activityType}</span>
                            </span>
                            <span className="text-muted text-[10px]">
                              📅 {sess.date} • ⏰ {sess.startTime}
                            </span>
                          </div>
                        ))
                      ) : (
                        activityDistribution.map((act, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-ink px-3 py-1.5 rounded-lg text-xs">
                            <span className="text-cream font-medium flex items-center gap-1.5">
                              <span>{ACTIVITY_EMOJIS[act.tag] || "📝"}</span>
                              <span>{act.tag}</span>
                            </span>
                            <span className="text-accent font-semibold">
                              {act.count} sessions
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Task Overview" delay={0.35}>
                {!summary || summary.totalTasks === 0 ? (
                  <EmptyState message="No tasks created yet" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-ink rounded-lg px-4 py-3">
                      <span className="text-cream text-sm">Total Tasks</span>
                      <span className="text-accent font-display text-lg">
                        <AnimatedNumber value={summary.totalTasks} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-ink rounded-lg px-4 py-3">
                      <span className="text-cream text-sm">Completed</span>
                      <span className="text-green-400 font-display text-lg">
                        <AnimatedNumber value={summary.completedTasks} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-ink rounded-lg px-4 py-3">
                      <span className="text-cream text-sm">
                        Completion Rate
                      </span>
                      <span className="text-purple-400 font-display text-lg">
                        <AnimatedNumber
                          value={summary.completionRate || 0}
                          suffix="%"
                        />
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-ink rounded-lg px-4 py-3">
                      <span className="text-cream text-sm">Max Streak</span>
                      <span className="text-orange-400 font-display text-lg">
                        🔥{" "}
                        <AnimatedNumber
                          value={summary.maxStreak || 0}
                          suffix="d"
                        />
                      </span>
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3 }}
      className="bg-ink-light border border-white/5 rounded-xl p-4 text-center transition-colors hover:border-accent/30"
    >
      <p className="font-display text-2xl text-cream">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
      <p className="text-muted text-xs mt-1">{label}</p>
    </motion.div>
  );
}

function ChartCard({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-ink-light border border-white/5 rounded-2xl p-5"
    >
      <h3 className="text-cream font-medium mb-4 text-sm">{title}</h3>
      {children}
    </motion.div>
  );
}

function EmptyState({ message = "Not enough data yet" }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-muted text-sm">
      {message}
    </div>
  );
}
