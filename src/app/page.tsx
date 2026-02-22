'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Database, Network, Zap, Settings, Bell, LayoutDashboard, BarChart3, 
  Globe, FileText, Send, Search, Building2, Sparkles, Bot, Plus, User,
  ArrowUpRight, Server, Activity, Calendar, ClipboardCheck, LucideIcon
} from 'lucide-react';

// =====================================================
// REUSABLE METRICS CHART COMPONENT
// =====================================================

// Type Definitions
interface DataPoint {
  x: number;      // 0-100 (percentage of x-axis)
  y: number;      // 0-100 (percentage of y-axis)
  label?: string; // Optional label (e.g., date)
}

interface ChartLine {
  id: string;
  data: DataPoint[];
  label: string;
  color: string;           // Color for dots and legend
  lineOpacity?: number;    // 0-1, line opacity
  lineWidth?: number;      // Line stroke width
  isPrimary?: boolean;     // Is this the main/bold line?
}

interface BottomStat {
  value: string;
  label: string;
  color: string;
  dots?: string[];
}

interface MetricsChartProps {
  title: string;
  icon?: LucideIcon;
  onAction?: () => void;
  subtitle?: string;
  mainValue?: string | number;
  mainValuePrefix?: string;
  dateLabel?: string;
  lines: ChartLine[];
  xLabels: string[];
  yLabels?: string[];
  stats?: BottomStat[];
  className?: string;
  chartHeight?: number;
}

// Utility: Generate smooth cubic bezier path
function generateSmoothPath(points: DataPoint[], width: number, height: number): string {
  if (points.length < 2) return '';
  const scaleX = (x: number) => (x / 100) * width;
  const scaleY = (y: number) => height - (y / 100) * height;
  let path = `M ${scaleX(points[0].x)} ${scaleY(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = scaleX(p1.x) + (scaleX(p2.x) - scaleX(p0.x)) / 6;
    const cp1y = scaleY(p1.y) + (scaleY(p2.y) - scaleY(p0.y)) / 6;
    const cp2x = scaleX(p2.x) - (scaleX(p3.x) - scaleX(p1.x)) / 6;
    const cp2y = scaleY(p2.y) - (scaleY(p3.y) - scaleY(p1.y)) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${scaleX(p2.x)} ${scaleY(p2.y)}`;
  }
  return path;
}

// Utility: Interpolate Y value at X position
function getYAtX(points: DataPoint[], targetX: number): number {
  if (points.length === 0) return 0;
  if (targetX <= points[0].x) return points[0].y;
  if (targetX >= points[points.length - 1].x) return points[points.length - 1].y;
  for (let i = 0; i < points.length - 1; i++) {
    if (targetX >= points[i].x && targetX <= points[i + 1].x) {
      const t = (targetX - points[i].x) / (points[i + 1].x - points[i].x);
      return points[i].y + t * (points[i + 1].y - points[i].y);
    }
  }
  return points[points.length - 1].y;
}

// Utility: Get label at X position
function getLabelAtX(lines: ChartLine[], targetX: number): string {
  const primaryLine = lines.find(l => l.isPrimary) || lines[0];
  if (!primaryLine?.data) return '';
  const points = primaryLine.data;
  for (let i = 0; i < points.length - 1; i++) {
    if (targetX >= points[i].x && targetX <= points[i + 1].x) {
      const t = (targetX - points[i].x) / (points[i + 1].x - points[i].x);
      return (t < 0.5 ? points[i] : points[i + 1]).label || '';
    }
  }
  return points[points.length - 1]?.label || '';
}

// Reusable MetricsChart Component
function MetricsChart({
  title, icon: Icon, onAction, subtitle, mainValue, mainValuePrefix = '↗',
  dateLabel, lines, xLabels, yLabels = ['100%', '75%', '50%', '25%'],
  stats, className = '', chartHeight = 75,
}: MetricsChartProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const chartWidth = 280;

  const processedLines = lines.map((line, idx) => ({
    ...line,
    lineOpacity: line.lineOpacity ?? (line.isPrimary ? 0.9 : Math.max(0.15, 0.4 - idx * 0.08)),
    lineWidth: line.lineWidth ?? (line.isPrimary ? 1.25 : 0.75),
  }));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverX(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div className={`glass-card-inner p-4 flex flex-col h-full min-h-[280px] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-[#5a4a45]" />}
          <span className="text-sm font-semibold text-[#3d2a2e]">{title}</span>
        </div>
        <button onClick={onAction} className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ArrowUpRight size={14} className="text-[#5a4a45]" />
        </button>
      </div>

      {/* Metrics Row */}
      {(subtitle || mainValue || dateLabel) && (
        <div className="flex items-end justify-between mb-3">
          <div>
            {subtitle && <p className="text-[10px] text-[#8a7a72] mb-0.5">{subtitle}</p>}
            {mainValue && (
              <div className="flex items-baseline">
                {mainValuePrefix && <span className="text-xs text-[#a09088] mr-1">{mainValuePrefix}</span>}
                <span className="text-2xl font-light text-[#3d2a2e]">
                  {typeof mainValue === 'number' ? `${mainValue.toFixed(2)}%` : mainValue}
                </span>
              </div>
            )}
          </div>
          {dateLabel && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white/10 rounded-lg border border-white/15">
              <span className="text-[10px] text-[#5a4a45]">{dateLabel}</span>
              <Calendar size={12} className="text-[#6b5a5e]" />
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 flex min-h-[100px]">
        <div className="flex flex-col justify-between pr-2 text-right" style={{ width: '32px' }}>
          {yLabels.map((label) => (
            <span key={label} className="text-[8px] text-[#9a8a82] leading-none">{label}</span>
          ))}
        </div>

        <div className="flex-1 relative cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverX(null)}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            {[0, 25, 50, 75, 100].map((y) => (
              <line key={y} x1="0" y1={chartHeight - (y / 100) * chartHeight} x2={chartWidth} y2={chartHeight - (y / 100) * chartHeight} stroke="rgba(180,160,150,0.12)" strokeWidth="0.5" />
            ))}
            {[...processedLines].reverse().map((line) => (
              <path key={line.id} d={generateSmoothPath(line.data, chartWidth, chartHeight)} fill="none" stroke={`rgba(255,255,255,${line.lineOpacity})`} strokeWidth={line.lineWidth} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {hoverX !== null && (
              <>
                <line x1={(hoverX / 100) * chartWidth} y1={0} x2={(hoverX / 100) * chartWidth} y2={chartHeight} stroke="rgba(255,255,255,0.5)" strokeWidth="0.75" strokeDasharray="1 2" />
                {processedLines.map((line) => (
                  <circle key={line.id} cx={(hoverX / 100) * chartWidth} cy={chartHeight - (getYAtX(line.data, hoverX) / 100) * chartHeight} r={line.isPrimary ? 3.5 : 2.5} fill={line.color} stroke="rgba(255,255,255,0.8)" strokeWidth={line.isPrimary ? 1.5 : 1} />
                ))}
              </>
            )}
          </svg>

          {hoverX !== null && (
            <div className="absolute pointer-events-none bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-lg border border-white/50 z-10" style={{ left: `${Math.min(80, Math.max(10, hoverX))}%`, top: '0px', transform: 'translateX(-50%)' }}>
              <p className="text-[9px] text-[#5a4a45] font-semibold mb-1 border-b border-gray-200 pb-1">{getLabelAtX(lines, hoverX)}</p>
              {processedLines.map((line) => (
                <div key={line.id} className="flex items-center gap-1.5 py-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
                  <span className={`text-[9px] ${line.isPrimary ? 'font-semibold text-[#3d2a2e]' : 'text-[#6b5a5e]'}`}>
                    {line.label}: {getYAtX(line.data, hoverX).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-1">
            {xLabels.map((label) => <span key={label} className="text-[7px] text-[#9a8a82]">{label}</span>)}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      {stats && stats.length > 0 && (
        <div className="grid gap-2 mt-3 pt-2 border-t border-white/10" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-base font-light text-[#3d2a2e]">{stat.value}</span>
                <span className="text-[8px]" style={{ color: stat.color }}>{stat.label}</span>
              </div>
              {stat.dots && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {stat.dots.map((c, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SAMPLE DATA GENERATOR (for demo)
// =====================================================

function generateTimeSeriesData(days: number, startValue: number, endValue: number, volatility: number = 0.02): DataPoint[] {
  const points: DataPoint[] = [];
  let current = startValue;
  const trend = (endValue - startValue) / days;
  for (let i = 0; i <= days; i++) {
    current = Math.max(0, Math.min(100, current + trend + (Math.random() - 0.5) * volatility * 100));
    points.push({ x: (i / days) * 100, y: current, label: `${i + 1} Apr` });
  }
  return points;
}

// =====================================================
// OTHER COMPONENTS (Gauge Card, Person Card, etc.)
// =====================================================

function MetricCard({ icon: Icon, title, value, goodStat, badStat }: { 
  icon: React.ElementType; title: string; value: number;
  goodStat: { value: string; label: string }; badStat: { value: string; label: string };
}) {
  const radius = 85, cx = 100, cy = 95;
  const circumference = Math.PI * radius;
  const progressOffset = circumference - (value / 100) * circumference;
  const tickCount = 60;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = 180 - (i / (tickCount - 1)) * 180;
    const rad = (angle * Math.PI) / 180;
    return { x1: cx + Math.cos(rad) * (radius + 2), y1: cy - Math.sin(rad) * (radius + 2), x2: cx + Math.cos(rad) * (radius + 8), y2: cy - Math.sin(rad) * (radius + 8) };
  });

  return (
    <div className="glass-card-inner p-4 flex flex-col h-full min-h-[260px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-[#5a4a45]" />
          <span className="text-sm font-semibold text-[#3d2a2e]">{title}</span>
        </div>
        <button className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ArrowUpRight size={14} className="text-[#5a4a45]" />
        </button>
      </div>
      <div className="flex items-center gap-5 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#c9b8b0]" />
          <span className="text-sm text-[#9a8a82]">{goodStat.value}</span>
          <span className="text-xs text-[#a89a92]">{goodStat.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4a3a35]" />
          <span className="text-sm font-medium text-[#3a2a25]">{badStat.value}</span>
          <span className="text-xs text-[#4a3a35]">{badStat.label}</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        <svg viewBox="0 0 200 110" className="w-full max-w-[280px]">
          {ticks.map((tick, i) => <line key={i} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />)}
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="rgba(200,180,170,0.15)" strokeWidth="4" strokeLinecap="round" />
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progressOffset} className="transition-all duration-1000 ease-out" />
          {(() => {
            const progressAngle = 180 - (value / 100) * 180;
            const rad = (progressAngle * Math.PI) / 180;
            return <line x1={cx + Math.cos(rad) * (radius - 6)} y1={cy - Math.sin(rad) * (radius - 6)} x2={cx + Math.cos(rad) * (radius + 10)} y2={cy - Math.sin(rad) * (radius + 10)} stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" className="transition-all duration-1000 ease-out" />;
          })()}
          <text x={cx} y={cy - 15} textAnchor="middle" className="fill-[#3d2a2e]" style={{ fontSize: '28px', fontWeight: 300 }}>
            <tspan className="fill-[#a09088]" style={{ fontSize: '12px' }}>↗</tspan>{value.toFixed(2)}%
          </text>
        </svg>
      </div>
    </div>
  );
}

function PersonCard({ name, role, avatar }: { name: string; role: string; avatar: string }) {
  return (
    <div className="glass-card-inner p-3 flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a89a] to-[#b08979] flex items-center justify-center text-white font-semibold text-sm">{avatar}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#3d2a2e] truncate">{name}</p>
        <p className="text-[10px] text-[#6b5a5e] truncate">{role}</p>
      </div>
      <div className="w-2 h-2 rounded-full bg-[#d4a89a]"></div>
    </div>
  );
}

function ChatMessage({ isBot, message }: { isBot: boolean; message: string }) {
  return (
    <div className={`flex gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-gradient-to-br from-[#d4a89a] to-[#b08979]' : 'bg-[#6b5a5e]'}`}>
        {isBot ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
      </div>
      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${isBot ? 'bg-white/20 text-[#3d2a2e] rounded-tl-sm' : 'bg-[#d4a89a]/20 text-[#3d2a2e] rounded-tr-sm'}`}>{message}</div>
    </div>
  );
}

function AIAssistantPanel() {
  const [input, setInput] = useState('');
  const messages = [
    { isBot: true, message: "Hello! I'm your AI assistant. How can I help you today?" },
    { isBot: false, message: "Show me server health status" },
    { isBot: true, message: "All 847 servers are operational. 3 warnings detected in the auth cluster." },
    { isBot: false, message: "What are the warnings?" },
    { isBot: true, message: "Auth Service showing high latency (2.5s avg). Cache layer memory at 89%. Recommend scaling cache nodes." },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a89a] to-[#b08979] flex items-center justify-center"><Sparkles size={16} className="text-white" /></div>
          <div><h3 className="text-xs font-semibold text-[#3d2a2e]">AI Assistant</h3><p className="text-[9px] text-[#6b5a5e]">Always ready to help</p></div>
        </div>
      </div>
      <div className="p-3 border-b border-white/10">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
            <Search size={12} className="text-[#6b5a5e]" />
            <input type="text" placeholder="Search conversations..." className="bg-transparent text-xs text-[#3d2a2e] placeholder-[#6b5a5e] outline-none w-full" />
          </div>
          <button className="p-1.5 bg-[#d4a89a]/20 rounded-lg hover:bg-[#d4a89a]/30 transition-colors"><Plus size={14} className="text-[#d4a89a]" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">{messages.map((msg, i) => <ChatMessage key={i} isBot={msg.isBot} message={msg.message} />)}</div>
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-xs text-[#3d2a2e] placeholder-[#6b5a5e] outline-none focus:bg-white/15 transition-colors" />
          <button className="p-2 bg-[#d4a89a] rounded-lg hover:bg-[#c49b8c] transition-colors"><Send size={14} className="text-white" /></button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MAIN DASHBOARD
// =====================================================

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'network', label: 'Network', icon: Globe },
  ];

  const people = [
    { name: 'Sarah Chen', role: 'DevOps Lead', avatar: 'SC' },
    { name: 'Mike Johnson', role: 'SRE Engineer', avatar: 'MJ' },
    { name: 'Lisa Park', role: 'Cloud Architect', avatar: 'LP' },
  ];

  const metricCards = [
    { icon: Server, title: 'Servers', value: 77.32, goodStat: { value: '823', label: 'Healthy' }, badStat: { value: '24', label: 'Warnings' } },
    { icon: Database, title: 'Databases', value: 94.15, goodStat: { value: '122', label: 'Online' }, badStat: { value: '2', label: 'Degraded' } },
    { icon: Activity, title: 'Services', value: 68.50, goodStat: { value: '14.9k', label: 'Requests' }, badStat: { value: '18', label: 'Pending' } },
  ];

  // SAMPLE DATA FOR METRICS CHART (can be replaced with real API data)
  const chartLines: ChartLine[] = [
    { id: 'closed', data: generateTimeSeriesData(30, 28, 80, 0.015), label: 'Closed', color: '#d4a89a', isPrimary: true },
    { id: 'open', data: generateTimeSeriesData(30, 45, 18, 0.04), label: 'Open', color: '#c9b870' },
    { id: 'timely', data: generateTimeSeriesData(30, 20, 70, 0.025), label: 'Timely', color: '#70c990' },
    { id: 'ontime', data: generateTimeSeriesData(30, 60, 92, 0.015), label: 'On Time', color: '#60b880' },
  ];

  const chartStats: BottomStat[] = [
    { value: '88', label: 'Closed', color: '#d4a89a', dots: ['#c9a090', '#d4a89a', '#e8c4b8', '#d4a89a'] },
    { value: '19', label: 'Open', color: '#c9b870', dots: ['#b8a860', '#c9b870', '#d4c890', '#c9b870'] },
    { value: '19/5', label: 'Timely', color: '#70c990', dots: ['#60b880', '#70c990', '#90d4a8', '#70c990'] },
    { value: '84/0', label: 'On Time', color: '#60b880', dots: ['#50a070', '#60b880', '#70c990', '#a06070'] },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="ambient-bg" />
      
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="app-wrapper">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a89a] to-[#b08979] flex items-center justify-center"><Zap size={18} className="text-white" /></div>
              <span className="text-sm font-semibold text-[#3d2a2e]">Obsidian</span>
            </div>
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setActiveNav(item.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeNav === item.id ? 'bg-[#d4a89a]/20 text-[#6b4a45]' : 'text-[#6b5a5e] hover:text-[#3d2a2e] hover:bg-white/10'}`}>
                  <item.icon size={14} />{item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#d4a89a] animate-pulse" />
              <span className="text-[10px] text-[#6b5a5e]">All systems operational</span>
            </div>
            <span className="text-[10px] text-[#6b5a5e] font-mono">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><Bell size={16} className="text-[#6b5a5e]" /></button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><Settings size={16} className="text-[#6b5a5e]" /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a89a] to-[#b08979] flex items-center justify-center text-white text-xs font-semibold">AR</div>
          </div>
        </header>

        {/* Main Content */}
        <div className="content-area">
          <aside className="left-panel"><AIAssistantPanel /></aside>
          <main className="main-panel">
            {/* Gauge Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {metricCards.map((card) => <MetricCard key={card.title} {...card} />)}
            </div>

            {/* REUSABLE METRICS CHART */}
            <div className="mb-4">
              <MetricsChart
                title="On-Time Closures"
                icon={ClipboardCheck}
                subtitle="Typical Account Metrics"
                mainValue={87.32}
                dateLabel="Apr 2025"
                lines={chartLines}
                xLabels={['1Apr', '5Apr', '10Apr', '15Apr', '20Apr', '25Apr', '30Apr']}
                stats={chartStats}
              />
            </div>

            {/* Team */}
            <div>
              <h3 className="text-xs font-semibold text-[#3d2a2e] mb-3">Team Online</h3>
              <div className="grid grid-cols-3 gap-3">{people.map((person) => <PersonCard key={person.name} {...person} />)}</div>
            </div>
          </main>
        </div>
      </motion.div>
    </div>
  );
}
