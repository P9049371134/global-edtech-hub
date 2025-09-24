import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Note = any;

type Props = {
  notes: Note[] | undefined | null;
  onSummarize: (noteId: string) => Promise<void>;
  onViewAll: () => void;
};

export function NotesTab({ notes, onSummarize, onViewAll }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">My Notes</h3>
        <Button onClick={onViewAll} variant="outline" className="border-purple-200">
          View All Notes
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(notes ?? []).slice(0, 4).map((note) => (
          <Card key={note._id} className="border-purple-100">
            <CardHeader>
              <CardTitle className="text-lg">{note.title}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-purple-200 text-purple-700">
                  {note.language}
                </Badge>
                {note.isAiGenerated && (
                  <Badge className="bg-purple-100 text-purple-800">AI Generated</Badge>
                )}
                {note.summary && (
                  <Badge className="bg-purple-100 text-purple-800">Summarized</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-3">{note.summary ?? note.content}</p>
              <div className="mt-4">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!!note.summary}
                  onClick={() => onSummarize(note._id)}
                >
                  Summarize with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
