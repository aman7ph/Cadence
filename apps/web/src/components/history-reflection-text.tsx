import React from "react";
import { Badge } from "@/components/ui/badge";

interface ReflectionTextProps {
  text: string;
  taggedRoutineIds: string[];
  taggedTaskIds: string[];
}

export function ReflectionText({ text, taggedRoutineIds, taggedTaskIds }: ReflectionTextProps) {
  const parts: React.ReactNode[] = [];
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const id = match[2]!;
    const tone = taggedRoutineIds.includes(id) ? "accent" : taggedTaskIds.includes(id) ? "carryover" : "neutral";
    parts.push(<Badge key={match.index} tone={tone}>@{match[1]!}</Badge>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return (
    <span className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">{parts}</span>
  );
}
