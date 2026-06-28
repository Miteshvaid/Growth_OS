import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
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
      <h3 className="text-cream font-medium mb-4 text-sm">
        Focus Activity Heatmap (Last 90 Days)
      </h3>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                title={`${day.date}: ${day.count} check-ins | Avg Focus: ${day.avgFocus || 0}`}
                className={`w-3 h-3 rounded-sm ${getIntensity(day.count, day.avgFocus)} transition-all hover:ring-1 hover:ring-white/30`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted">
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
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filterDataByRange = (dataArray) => {
    if (!dataArray || dateRange === 0) return dataArray;
    return dataArray.slice(-dateRange);
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

  if (!data) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="text-muted p-10">Error loading analytics</div>
      </div>
    );
  }

  const { summary, trends, breakdown } = data;
  const { focus, tasks } = trends || {};
  const { activities } = breakdown || {};

  // Insights generate karo
  const insights = [];

  if (activities && Object.keys(activities).length > 0) {
    const topActivity = Object.entries(activities).sort(
      (a, b) => b[1] - a[1]
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
      d.avgFocus > max.avgFocus ? d : max
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

  // Heatmap data
  const heatmapData = (focus || []).map((f) => ({
    date: f.date,
    count: 1,
    avgFocus: f.avgFocus,
  }));

  // Activity distribution for pie chart
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
          <div className="flex items-center justify-between mt-2 mb-8">
            <h1 className="font-display text-3xl text-cream">
              Focus Analytics
            </h1>

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
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {insights.map((insight, i) => (
                <InsightCard key={i} {...insight} />
              ))}
            </div>
          )}

          {/* Heatmap */}
          <div className="mb-8">
            <CalendarHeatmap data={heatmapData} />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Focus Trend */}
            <ChartCard title="Focus Rating Trend" delay={0.2}>
              {!focus || focus.length === 0 ? (
                <EmptyState message="No focus check-ins yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={filterDataByRange(focus)}>
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
                          stopColor="#7c3aed"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#7c3aed"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#8a9388", fontSize: 11 }}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      domain={[1, 5]}
                      tick={{ fill: "#8a9388", fontSize: 11 }}
                      allowDecimals={false}
                      tickFormatter={(v) => FOCUS_LABELS[v] || v}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1a2118",
                        border: "1px solid #ffffff20",
                      }}
                      formatter={(value) => [`${value}/5`, "Avg Focus"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgFocus"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#focusGradient)"
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Task Completion */}
            <ChartCard title="Task Completion" delay={0.25}>
              {!tasks || tasks.length === 0 ? (
                <EmptyState message="No tasks tracked yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={filterDataByRange(tasks)}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#8a9388", fontSize: 11 }}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      tick={{ fill: "#8a9388", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1a2118",
                        border: "1px solid #ffffff20",
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      name="Completed"
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="total"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Total"
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Activity Distribution */}
            <ChartCard title="Focus Activities" delay={0.3}>
              {activityDistribution.length === 0 ? (
                <EmptyState message="No activities logged yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={activityDistribution}
                      dataKey="count"
                      nameKey="tag"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ tag, count }) =>
                        `${ACTIVITY_EMOJIS[tag] || "📝"} ${tag} (${count})`
                      }
                      animationDuration={800}
                    >
                      {activityDistribution.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1a2118",
                        border: "1px solid #ffffff20",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Task Overview */}
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
                    <span className="text-cream text-sm">Completion Rate</span>
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