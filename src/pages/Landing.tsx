import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Globe, 
  Brain, 
  BarChart3, 
  Video, 
  Users, 
  BookOpen, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  MessageSquare,
  FileText,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ChatBox } from "@/components/landing/ChatBox";
import { PresencePanel } from "@/components/landing/PresencePanel";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RTCDemo } from "@/components/landing/RTCDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: "Live Virtual Classrooms",
      description: "Interactive video sessions with real-time collaboration tools",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Globe,
      title: "Real-time Translation",
      description: "Break language barriers with instant translation in 50+ languages",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Brain,
      title: "AI Note Summarization",
      description: "Automatically generate summaries and key points from your notes",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Detailed reports on attendance, participation, and learning progress",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Mathematics Teacher",
      content: "EduCollab transformed my online teaching. The AI summaries help students review key concepts effortlessly.",
      rating: 5
    },
    {
      name: "Miguel Rodriguez",
      role: "High School Student",
      content: "The real-time translation feature lets me learn from teachers worldwide. It's incredible!",
      rating: 5
    },
    {
      name: "Dr. Priya Patel",
      role: "University Professor",
      content: "The performance analytics give me insights I never had before. I can help struggling students immediately.",
      rating: 5
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Students" },
    { number: "500+", label: "Expert Teachers" },
    { number: "50+", label: "Languages Supported" },
    { number: "95%", label: "Student Satisfaction" }
  ];

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

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <CTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}