import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Globe, Brain, BarChart3, Video, Play, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";

export function Hero() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { number: "10K+", label: "Active Students" },
    { number: "500+", label: "Expert Teachers" },
    { number: "50+", label: "Languages Supported" },
    { number: "95%", label: "Student Satisfaction" },
  ];

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">🚀 Global EdTech Platform</Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Learn Without
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Boundaries</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Connect with educators worldwide through our AI-powered virtual learning platform. Real-time translation,
                smart note-taking, and performance analytics all in one place.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
              >
                <Play className="mr-2 h-5 w-5" />
                {isAuthenticated ? "Go to Dashboard" : "Start Learning"}
              </Button>
              <Button size="lg" variant="outline" className="border-blue-200 hover:bg-blue-50 text-lg px-8 py-3">
                <Video className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            <div className="relative bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-blue-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-purple-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Translating to Spanish...</span>
                </div>
              </div>

              <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </motion.div>

              <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
