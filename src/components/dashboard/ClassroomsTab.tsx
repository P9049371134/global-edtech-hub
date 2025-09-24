import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Play, Globe, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

type Classroom = any;

type Props = {
  classrooms: Classroom[] | undefined | null;
  availableClassrooms: Classroom[] | undefined | null;
  isTeacher: boolean;
  onCreateClassroom: () => void;
  onStartSession: (classroomId: string, title: string) => void;
  onEnroll: (classroomId: string) => void;
};

export function ClassroomsTab({
  classrooms,
  availableClassrooms,
  isTeacher,
  onCreateClassroom,
  onStartSession,
  onEnroll,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">My Classrooms</h3>
        {isTeacher && (
          <Button onClick={onCreateClassroom} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Classroom
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(classrooms ?? []).map((classroom) => (
          <motion.div
            key={classroom._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-100">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{classroom.name}</CardTitle>
                    <CardDescription>{classroom.subject}</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {classroom.grade || "All Levels"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span>{classroom.language}</span>
                  </div>
                  {isTeacher && (
                    <Button
                      size="sm"
                      onClick={() => onStartSession(classroom._id, `${classroom.name} Session`)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!isTeacher && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4">Available Classrooms</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(availableClassrooms ?? [])
              .filter((c) => !(classrooms ?? []).some((e) => e._id === c._id))
              .map((classroom) => (
                <Card key={classroom._id} className="border-green-100">
                  <CardHeader>
                    <CardTitle className="text-lg">{classroom.name}</CardTitle>
                    <CardDescription>{classroom.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        {classroom.grade || "All Levels"}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => onEnroll(classroom._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Enroll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
