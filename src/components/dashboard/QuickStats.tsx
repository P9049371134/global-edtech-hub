import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Video, FileText, BarChart3 } from "lucide-react";

type Props = {
  classroomsCount: number;
  liveCount: number;
  notesCount: number;
  reportsCount: number;
};

export function QuickStats({ classroomsCount, liveCount, notesCount, reportsCount }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">My Classrooms</p>
              <p className="text-2xl font-bold">{classroomsCount}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Live Sessions</p>
              <p className="text-2xl font-bold">{liveCount}</p>
            </div>
            <Video className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">My Notes</p>
              <p className="text-2xl font-bold">{notesCount}</p>
            </div>
              <FileText className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Reports</p>
              <p className="text-2xl font-bold">{reportsCount}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
