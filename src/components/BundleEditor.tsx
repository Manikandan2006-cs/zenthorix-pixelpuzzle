import { useState } from "react";
import { QuestionBundle, Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  bundle: QuestionBundle | null;
  onSave: (bundle: QuestionBundle) => void;
  onCancel: () => void;
}

const BundleEditor = ({ bundle, onSave, onCancel }: Props) => {
  const [name, setName] = useState(bundle?.name || "");
  const [questions, setQuestions] = useState<Question[]>(bundle?.questions || []);
  const [bulkInput, setBulkInput] = useState("");
  const [mode, setMode] = useState<"manual" | "bulk">("manual");

  const addQuestion = () => {
    setQuestions([...questions, { id: crypto.randomUUID(), text: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: unknown) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const parseBulkInput = () => {
    const blocks = bulkInput.trim().split(/\n\n+/);
    const parsed: Question[] = [];
    for (const block of blocks) {
      const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 5) continue;
      const text = lines[0].replace(/^\d+[\.\)]\s*/, "");
      const options: string[] = [];
      let correctAnswer = 0;
      for (let i = 1; i < lines.length; i++) {
        const optMatch = lines[i].match(/^([A-Da-d])[\.\)]\s*(.+)/);
        if (optMatch) options.push(optMatch[2]);
        const ansMatch = lines[i].match(/^(?:Answer|Ans|Correct)\s*[:\-]\s*([A-Da-d])/i);
        if (ansMatch) correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
      }
      if (options.length >= 2) {
        parsed.push({ id: crypto.randomUUID(), text, options: options.slice(0, 4), correctAnswer });
      }
    }
    if (parsed.length > 0) {
      setQuestions([...questions, ...parsed]);
      setBulkInput("");
      setMode("manual");
    }
  };

  const handleSave = () => {
    if (!name.trim() || questions.length === 0) return;
    onSave({ id: bundle?.id || crypto.randomUUID(), name: name.trim(), questions });
  };

  return (
    <div className="card-surface subtle-shadow-lg p-5 space-y-4">
      <h3 className="font-display font-semibold text-foreground">
        {bundle ? "Edit Bundle" : "New Bundle"}
      </h3>

      <div className="space-y-1.5">
        <label className="text-sm font-body font-medium text-muted-foreground">Bundle Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Round 1 - Science" />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setMode("manual")}
          className={`font-display text-xs ${mode === "manual" ? "border-primary text-primary" : ""}`}>
          Manual
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMode("bulk")}
          className={`font-display text-xs ${mode === "bulk" ? "border-primary text-primary" : ""}`}>
          Bulk Paste
        </Button>
      </div>

      {mode === "bulk" ? (
        <div className="space-y-2">
          <Textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)}
            placeholder={`Paste questions:\n\n1. Question?\nA) Option\nB) Option\nC) Option\nD) Option\nAnswer: B`}
            className="min-h-[200px] font-body" />
          <Button onClick={parseBulkInput} className="font-display text-sm">Parse & Add</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div key={q.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-muted-foreground">Q{qi + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeQuestion(qi)} className="text-destructive text-xs h-6 px-2">✕</Button>
              </div>
              <Input value={q.text} onChange={(e) => updateQuestion(qi, "text", e.target.value)} placeholder="Question text" />
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex gap-1 items-center">
                    <button onClick={() => updateQuestion(qi, "correctAnswer", oi)}
                      className={`w-6 h-6 rounded-full text-xs font-display font-bold shrink-0 ${
                        q.correctAnswer === oi ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>{String.fromCharCode(65 + oi)}</button>
                    <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="text-sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addQuestion} className="w-full border-dashed font-display text-sm">
            + Add Question
          </Button>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={!name.trim() || questions.length === 0} className="font-display tracking-wide">
          Save Bundle ({questions.length} Q)
        </Button>
        <Button variant="outline" onClick={onCancel} className="font-display tracking-wide">Cancel</Button>
      </div>
    </div>
  );
};

export default BundleEditor;
