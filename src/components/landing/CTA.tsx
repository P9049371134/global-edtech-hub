import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Video, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";

export function CTA() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl text-blue-100 leading-relaxed">
            Join thousands of students and teachers who are already breaking language barriers and achieving better learning outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Free Today"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
              <Video className="mr-2 h-5 w-5" />
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
