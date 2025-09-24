import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RTCDemo } from "@/components/landing/RTCDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import * as React from "react";

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <motion.img
                src="/logo.svg"
                alt="EduCollab"
                className="h-8 w-8 cursor-pointer"
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduCollab
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                  <Button 
                    onClick={() => navigate("/dashboard")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* How it Works */}
      <HowItWorks />

      {/* Real-time Collaboration Demo */}
      <RTCDemo />

      {/* Summarize Demo */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Summarize Any Text (AI)
              </h3>
            </div>
            <SummarizeDemo />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <CTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Inline, compact demo component
function SummarizeDemo() {
  const summarize = useAction(api.ai.summarizeText as any);
  const [text, setText] = React.useState("");
  const [length, setLength] = React.useState<"short" | "medium" | "detailed">("short");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ summary: string; keyPoints: string[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const out = await summarize({ text, length });
      setResult(out as any);
    } catch (e: any) {
      setError(e?.message || "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-32 p-3 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
        placeholder="Paste notes, a lecture transcript, or any text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm text-gray-600">Summary length:</span>
          <select
            className="text-sm border border-purple-200 rounded px-2 py-1 bg-white"
            value={length}
            onChange={(e) => setLength(e.target.value as any)}
          >
            <option value="short">Quick (2-3 sentences)</option>
            <option value="medium">Standard (4-6 bullets)</option>
            <option value="detailed">Detailed (with definitions)</option>
          </select>
        </div>
        <Button
          onClick={onRun}
          disabled={!text.trim() || loading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? "Summarizing..." : "Summarize"}
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {result && (
        <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
          <div className="mb-2">
            <div className="text-sm font-semibold text-purple-800">Summary</div>
            <p className="text-sm text-gray-700">{result.summary}</p>
          </div>
          <div className="mt-3">
            <div className="text-sm font-semibold text-purple-800">Key Points</div>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {(result.keyPoints || []).map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}