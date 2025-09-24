import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  userRole: string;
  userName?: string | null;
  onLogoClick: () => void;
  onProfileClick: () => void;
};

export function HeaderBar({ userRole, userName, onLogoClick, onProfileClick }: Props) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.svg"
              alt="EduCollab"
              className="h-8 w-8 cursor-pointer"
              onClick={onLogoClick}
            />
            <h1 className="text-xl font-bold text-gray-900">EduCollab</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
            <Button
              variant="outline"
              onClick={onProfileClick}
              className="border-blue-200 hover:bg-blue-50"
            >
              Profile
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
