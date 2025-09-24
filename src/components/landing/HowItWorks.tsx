import { motion } from "framer-motion";
import { Users, MessageSquare, TrendingUp } from "lucide-react";

export function HowItWorks() {
  const steps = [
    { step: "01", title: "Join or Create", description: "Sign up and join existing classrooms or create your own virtual learning space", icon: Users },
    { step: "02", title: "Learn & Collaborate", description: "Attend live sessions with real-time translation and AI-powered note-taking", icon: MessageSquare },
    { step: "03", title: "Track Progress", description: "Monitor your learning journey with detailed analytics and performance reports", icon: TrendingUp },
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How EduCollab Works</h2>
          <p className="text-xl text-gray-600">Get started in three simple steps</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.2 }} className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {step.step}
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <step.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
