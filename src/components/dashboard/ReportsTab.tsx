import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

type Report = any;

type Props = {
  reports: Report[] | undefined | null;
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onGenerate: () => void;
};

export function ReportsTab({
  reports,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onGenerate,
}: Props) {
  const chartData = (reports ?? [])
    .slice()
    .reverse()
    .map((r) => ({
      date: new Date(r.endDate).toLocaleDateString(),
      attendance: Math.round(r.attendanceRate),
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="border border-orange-200 rounded px-2 py-1 text-sm"
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="border border-orange-200 rounded px-2 py-1 text-sm"
          />
        </div>
        <h3 className="text-xl font-semibold">Performance Reports</h3>
        <Button onClick={onGenerate} variant="outline" className="border-orange-200">
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(reports ?? []).slice(0, 4).map((report) => (
          <Card key={report._id} className="border-orange-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">{report.reportType} Report</CardTitle>
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {report.attendanceRate.toFixed(0)}%
                </Badge>
              </div>
              <CardDescription>
                <Calendar className="h-4 w-4 inline mr-1" />
                {new Date(report.startDate).toLocaleDateString()} -{" "}
                {new Date(report.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Participation Score:</span>
                  <span className="font-medium">{report.participationScore}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Notes Created:</span>
                  <span className="font-medium">{report.notesCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle className="text-lg">Attendance Trend</CardTitle>
          <CardDescription>Recent report attendance rates</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#fb923c"
                fillOpacity={1}
                fill="url(#colorAttend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
