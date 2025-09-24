import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Video, Globe, Brain, BarChart3 } from "lucide-react";

export function Features() {
  const features = [
    { icon: Video, title: "Live Virtual Classrooms", description: "Interactive video sessions with real-time collaboration tools", color: "from-blue-500 to-blue-600" },
    { icon: Globe, title: "Real-time Translation", description: "Break language barriers with instant translation in 50+ languages", color: "from-green-500 to-green-600" },
    { icon: Brain, title: "AI Note Summarization", description: "Automatically generate summaries and key points from your notes", color: "from-purple-500 to-purple-600" },
    { icon: BarChart3, title: "Performance Analytics", description: "Detailed reports on attendance, participation, and learning progress", color: "from-orange-500 to-orange-600" },
  ];
  return (
    <section className="py-20 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Learning</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Our AI-powered platform breaks down barriers and creates seamless learning experiences for students and teachers worldwide.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.05 }} className="group">
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
