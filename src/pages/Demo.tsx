import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export default function Demo() {
  const navigate = useNavigate();

  // Translate
  const [text, setText] = useState("");
  const [lang, setLang] = useState("en");
  const [translated, setTranslated] = useState<string | null>(null);
  const translate = useMutation(api.demo.translateMock);

  // Summarize
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const summarize = useMutation(api.demo.summarizeMock);

  // Dummy reports data
  const chartData = [
    { date: "Mon", attendance: 72 },
    { date: "Tue", attendance: 81 },
    { date: "Wed", attendance: 65 },
    { date: "Thu", attendance: 90 },
    { date: "Fri", attendance: 78 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="EduCollab" className="h-8 w-8 cursor-pointer" onClick={() => navigate("/")} />
            <h1 className="text-xl font-bold text-gray-900">Demo</h1>
            <span className="text-xs text-gray-500">Translate • Summarize • Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-blue-200" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button variant="outline" className="border-blue-200" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Translate */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg">Translate (Mock)</CardTitle>
            <CardDescription>Type text, choose a language, and click Translate to see a mocked result.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to translate..."
                className="col-span-2 min-h-24 border rounded-md p-2 text-sm border-blue-200 bg-white"
              />
              <div className="space-y-2">
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    if (!text.trim()) {
                      toast.error("Please enter text to translate");
                      return;
                    }
                    try {
                      const res = await translate({ text, toLanguage: lang });
                      setTranslated(res.translated);
                      toast.success("Translated (mock)");
                    } catch {
                      toast.error("Translate failed");
                    }
                  }}
                >
                  Translate
                </Button>
              </div>
            </div>
            {translated && (
              <div className="mt-2 p-3 rounded-md border border-blue-100 bg-white text-sm">
                <div className="text-gray-500 mb-1">Result</div>
                <div className="font-medium text-gray-900">{translated}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summarize */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg">Summarize (Mock)</CardTitle>
            <CardDescription>Paste content and click Summarize to see a mocked summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Paste content to summarize..."
                className="col-span-2 min-h-24 border rounded-md p-2 text-sm border-purple-200 bg-white"
              />
              <div className="space-y-2">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={async () => {
                    if (!note.trim()) {
                      toast.error("Please paste content to summarize");
                      return;
                    }
                    try {
                      const res = await summarize({ text: note });
                      setSummary(res.summary);
                      toast.success("Summarized (mock)");
                    } catch {
                      toast.error("Summarize failed");
                    }
                  }}
                >
                  Summarize
                </Button>
              </div>
            </div>
            {summary && (
              <div className="mt-2 p-3 rounded-md border border-purple-100 bg-white text-sm">
                <div className="text-gray-500 mb-1">Result</div>
                <div className="font-medium text-gray-900">{summary}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle className="text-lg">Reports (Placeholder)</CardTitle>
            <CardDescription>Demo chart with dummy attendance data.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAttendDemo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="attendance" stroke="#fb923c" fillOpacity={1} fill="url(#colorAttendDemo)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
