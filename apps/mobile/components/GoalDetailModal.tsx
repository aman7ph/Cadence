import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionSheet } from "./ActionSheet";
import { GoalFormModal } from "./GoalFormModal";
import { DatePickerModal } from "./DatePickerModal";
import { GoalActionButtons } from "./GoalActionButtons";
import { GoalDailyTracking } from "./GoalDailyTracking";
import { useColors } from "../lib/theme";
import { fmtTimestamp } from "../lib/dateUtils";

export interface GoalData {
  _id: Id<"goals">; title: string; status: string; description?: string;
  targetValue?: number; currentValue?: number; unit?: string; dueDate?: string;
  createdAt: number; completedAt?: number;
}

function tsToDateStr(ts: number) { return new Date(ts).toISOString().slice(0, 10); }
function shiftDate(d: string, n: number) { const dt = new Date(d + "T12:00:00"); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }

function GoalDetailContent({ goal: initGoal, onClose }: { goal: GoalData; onClose: () => void }) {
  const c = useColors();
  const today = todayLocal();
  const [confirm, setConfirm]       = useState<"complete" | "abandon" | null>(null);
  const [selDate, setSelDate]       = useState(today);
  const [editKey, setEditKey]       = useState(0);
  const [editOpen, setEditOpen]     = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);

  const linked   = useQuery(api.goalLinks.getLinkedItems, { goalId: initGoal._id });
  const day      = useQuery(api.goalLinks.getDayForGoal,  { goalId: initGoal._id, date: selDate });
  const complete = useMutation(api.goals.complete);
  const abandon  = useMutation(api.goals.abandon);
  const remove   = useMutation(api.goals.remove);

  const goal         = (linked?.goal ?? initGoal) as GoalData;
  const isActive     = goal.status === "active";
  const minDate      = tsToDateStr(goal.createdAt);
  const maxDate      = goal.completedAt ? tsToDateStr(goal.completedAt) : today;
  const currentValue = (linked?.tasks ?? []).filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.goalContribution ?? 0), 0);
  const pct       = goal.targetValue ? Math.min(100, Math.round((currentValue / goal.targetValue) * 100)) : null;
  const barColor  = pct === 100 ? c.success : c.prim;
  const badge     = goal.status === "completed"
    ? { bg: "rgba(34,197,94,0.14)", fg: "#4ade80", label: "Completed" }
    : goal.status === "abandoned"
    ? { bg: "rgba(107,114,128,0.14)", fg: "#9ca3af", label: "Abandoned" }
    : { bg: "rgba(99,102,241,0.14)", fg: "#818cf8", label: "Active" };
  const routines  = day?.routines ?? [];
  const tasks     = (day?.tasks ?? []).filter((t) => t.status !== "dismissed");

  const s = StyleSheet.create({
    screen:   { flex: 1, backgroundColor: c.bg },
    topRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
                paddingTop: 6, paddingBottom: 10, gap: 8 },
    iconBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: c.card,
                borderWidth: 1, borderColor: c.bd2, alignItems: "center", justifyContent: "center" },
    editBtn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: c.bd2 },
    card:     { marginHorizontal: 16, marginBottom: 10, backgroundColor: c.card,
                borderWidth: 1, borderColor: c.bd1, borderRadius: 14, padding: 14 },
    title:    { fontSize: 22, fontWeight: "700", color: c.t1, letterSpacing: -0.5, marginBottom: 10, lineHeight: 28 },
    metaRow:  { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 },
    badge:    { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
    startTxt: { fontSize: 12, color: c.t3 },
    dueBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: "rgba(224,161,0,0.12)" },
    dueTxt:   { fontSize: 11, fontWeight: "600", color: "#c2820b" },
    desc:     { fontSize: 13, color: c.t2, lineHeight: 20, marginBottom: 8 },
    divider:  { height: 1, backgroundColor: c.bd1, marginVertical: 10 },
    pRow:     { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 },
    bigNum:   { fontSize: 44, fontWeight: "700", color: c.t1, letterSpacing: -1.5, lineHeight: 48 },
    pOfTxt:   { fontSize: 15, color: c.t2, marginBottom: 7, marginLeft: 4 },
    pPct:     { fontSize: 16, fontWeight: "700", marginBottom: 7 },
    track:    { height: 5, backgroundColor: c.active, borderRadius: 3, overflow: "hidden" },
    content:  { paddingBottom: 40 },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
      <View style={s.topRow}>
        <TouchableOpacity style={s.iconBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.t2 }}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {isActive && (
          <TouchableOpacity style={s.editBtn} onPress={() => { setEditKey((k) => k + 1); setEditOpen(true); }} activeOpacity={0.7}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: c.t2 }}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.iconBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.t2 }}>•••</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.title}>{goal.title}</Text>
          <View style={s.metaRow}>
            <View style={[s.badge, { backgroundColor: badge.bg }]}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: badge.fg }}>{badge.label}</Text>
            </View>
            <Text style={s.startTxt}>Started {fmtTimestamp(goal.createdAt)}</Text>
            {goal.dueDate && <View style={s.dueBadge}><Text style={s.dueTxt}>Due {goal.dueDate}</Text></View>}
          </View>
          {goal.description ? <Text style={s.desc}>{goal.description}</Text> : null}
          {isActive && (
            <>
              <View style={s.divider} />
              <GoalActionButtons
                confirm={confirm}
                onConfirmChange={setConfirm}
                onComplete={async () => { await complete({ goalId: initGoal._id }); setConfirm(null); onClose(); }}
                onAbandon={async () => { await abandon({ goalId: initGoal._id }); setConfirm(null); onClose(); }}
              />
            </>
          )}
        </View>

        {goal.targetValue != null && (
          <View style={s.card}>
            <View style={s.pRow}>
              <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={s.bigNum}>{currentValue}</Text>
                <Text style={s.pOfTxt}>/ {goal.targetValue}{goal.unit ? ` ${goal.unit}` : ""}</Text>
              </View>
              <Text style={[s.pPct, { color: barColor }]}>{pct}%</Text>
            </View>
            <View style={s.track}>
              <View style={{ height: "100%", borderRadius: 3, width: `${pct ?? 0}%`, backgroundColor: barColor }} />
            </View>
          </View>
        )}

        <GoalDailyTracking
          selDate={selDate} minDate={minDate} maxDate={maxDate}
          onPrev={() => setSelDate((d) => shiftDate(d, -1))}
          onNext={() => setSelDate((d) => shiftDate(d, 1))}
          onOpenPicker={() => setPickerOpen(true)}
          routines={routines as { routineId: string; name: string; status: string }[]}
          tasks={tasks as { taskId: string; title: string; status: string }[]}
          loading={day === undefined}
        />
      </ScrollView>

      <ActionSheet visible={menuOpen} title={goal.title}
        actions={[{ label: "Delete goal", style: "destructive",
          onPress: async () => { await remove({ goalId: initGoal._id }); onClose(); } }]}
        onCancel={() => setMenuOpen(false)} />
      <GoalFormModal key={editKey} visible={editOpen}
        goal={{ _id: initGoal._id, title: goal.title, description: goal.description,
                targetValue: goal.targetValue, unit: goal.unit, dueDate: goal.dueDate }}
        onDone={() => setEditOpen(false)} />
      <DatePickerModal visible={pickerOpen} value={selDate} min={minDate} max={maxDate}
        onChange={setSelDate} onClose={() => setPickerOpen(false)} />
    </SafeAreaView>
  );
}

export function GoalDetailModal({ goal, onClose }: { goal: GoalData | null; onClose: () => void }) {
  return (
    <Modal visible={!!goal} animationType="slide" onRequestClose={onClose}>
      {goal && <GoalDetailContent goal={goal} onClose={onClose} />}
    </Modal>
  );
}
