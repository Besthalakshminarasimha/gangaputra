import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Handshake, 
  Bookmark, 
  BookmarkCheck, 
  Plus, 
  Send,
  User,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Question {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
  answers_count?: number;
  handshakes_count?: number;
  is_saved?: boolean;
  is_handshaked?: boolean;
}

interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
}

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [newAnswer, setNewAnswer] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [user]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (questionsError) throw questionsError;

      // Get unique user IDs
      const userIds = [...new Set(questionsData?.map(q => q.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profilesMap: Record<string, { full_name: string; email: string }> = {};
      profilesData?.forEach(p => {
        profilesMap[p.id] = { full_name: p.full_name || "", email: p.email || "" };
      });

      // Fetch handshakes count for each question
      const { data: handshakesData } = await supabase
        .from("question_handshakes")
        .select("question_id");

      // Fetch answers count for each question
      const { data: answersData } = await supabase
        .from("answers")
        .select("question_id");

      // Fetch user's saves
      let userSaves: string[] = [];
      let userHandshakes: string[] = [];
      
      if (user) {
        const { data: savesData } = await supabase
          .from("question_saves")
          .select("question_id")
          .eq("user_id", user.id);
        
        const { data: userHandshakesData } = await supabase
          .from("question_handshakes")
          .select("question_id")
          .eq("user_id", user.id);
        
        userSaves = savesData?.map(s => s.question_id) || [];
        userHandshakes = userHandshakesData?.map(h => h.question_id) || [];
      }

      // Count handshakes and answers per question
      const handshakeCounts: Record<string, number> = {};
      const answerCounts: Record<string, number> = {};
      
      handshakesData?.forEach(h => {
        handshakeCounts[h.question_id] = (handshakeCounts[h.question_id] || 0) + 1;
      });
      
      answersData?.forEach(a => {
        answerCounts[a.question_id] = (answerCounts[a.question_id] || 0) + 1;
      });

      const enrichedQuestions: Question[] = questionsData?.map(q => ({
        ...q,
        profiles: profilesMap[q.user_id] || null,
        handshakes_count: handshakeCounts[q.id] || 0,
        answers_count: answerCounts[q.id] || 0,
        is_saved: userSaves.includes(q.id),
        is_handshaked: userHandshakes.includes(q.id)
      })) || [];

      setQuestions(enrichedQuestions);
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    try {
      const { data, error } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get unique user IDs from answers
      const userIds = [...new Set(data?.map(a => a.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profilesMap: Record<string, { full_name: string; email: string }> = {};
      profilesData?.forEach(p => {
        profilesMap[p.id] = { full_name: p.full_name || "", email: p.email || "" };
      });

      const enrichedAnswers: Answer[] = data?.map(a => ({
        ...a,
        profiles: profilesMap[a.user_id] || null
      })) || [];

      setAnswers(prev => ({ ...prev, [questionId]: enrichedAnswers }));
    } catch (error) {
      console.error("Error fetching answers:", error);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!user) {
      toast({ title: "Please login to ask a question", variant: "destructive" });
      return;
    }

    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("questions").insert({
        user_id: user.id,
        title: newQuestion.title.trim(),
        content: newQuestion.content.trim()
      });

      if (error) throw error;

      toast({ title: "Question posted successfully!" });
      setNewQuestion({ title: "", content: "" });
      setIsDialogOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast({ title: "Error posting question", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!user) {
      toast({ title: "Please login to answer", variant: "destructive" });
      return;
    }

    const content = newAnswer[questionId]?.trim();
    if (!content) {
      toast({ title: "Please enter an answer", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("answers").insert({
        question_id: questionId,
        user_id: user.id,
        content
      });

      if (error) throw error;

      toast({ title: "Answer posted!" });
      setNewAnswer(prev => ({ ...prev, [questionId]: "" }));
      fetchAnswers(questionId);
      fetchQuestions();
    } catch (error: any) {
      toast({ title: "Error posting answer", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleSave = async (questionId: string, isSaved: boolean) => {
    if (!user) {
      toast({ title: "Please login to save questions", variant: "destructive" });
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from("question_saves")
          .delete()
          .eq("question_id", questionId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("question_saves")
          .insert({ question_id: questionId, user_id: user.id });
      }
      fetchQuestions();
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleToggleHandshake = async (questionId: string, isHandshaked: boolean) => {
    if (!user) {
      toast({ title: "Please login to handshake", variant: "destructive" });
      return;
    }

    try {
      if (isHandshaked) {
        await supabase
          .from("question_handshakes")
          .delete()
          .eq("question_id", questionId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("question_handshakes")
          .insert({ question_id: questionId, user_id: user.id });
      }
      fetchQuestions();
    } catch (error) {
      console.error("Error toggling handshake:", error);
    }
  };

  const toggleExpand = (questionId: string) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
      if (!answers[questionId]) {
        fetchAnswers(questionId);
      }
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading community...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Community Questions</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ask Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Question title..."
                value={newQuestion.title}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Describe your question in detail..."
                value={newQuestion.content}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
              <Button onClick={handleSubmitQuestion} disabled={submitting} className="w-full">
                {submitting ? "Posting..." : "Post Question"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(question.profiles?.full_name, question.profiles?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {question.profiles?.full_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <CardTitle className="text-base mt-1">{question.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{question.content}</p>
                
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground"
                    onClick={() => handleToggleHandshake(question.id, question.is_handshaked || false)}
                  >
                    <Handshake className={`h-4 w-4 ${question.is_handshaked ? "text-primary fill-primary/20" : ""}`} />
                    <span>{question.handshakes_count || 0}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground"
                    onClick={() => handleToggleSave(question.id, question.is_saved || false)}
                  >
                    {question.is_saved ? (
                      <BookmarkCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    <span>Save</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground ml-auto"
                    onClick={() => toggleExpand(question.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{question.answers_count || 0} Answers</span>
                    {expandedQuestion === question.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {expandedQuestion === question.id && (
                  <div className="pt-3 space-y-4 border-t">
                    {answers[question.id]?.map((answer) => (
                      <div key={answer.id} className="flex gap-3 pl-4 border-l-2 border-primary/20">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {getInitials(answer.profiles?.full_name, answer.profiles?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {answer.profiles?.full_name || "Anonymous"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{answer.content}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Write your answer..."
                        value={newAnswer[question.id] || ""}
                        onChange={(e) => setNewAnswer(prev => ({ ...prev, [question.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitAnswer(question.id);
                          }
                        }}
                      />
                      <Button size="icon" onClick={() => handleSubmitAnswer(question.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;