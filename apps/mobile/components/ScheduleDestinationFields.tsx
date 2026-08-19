import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fmtLong } from "../lib/dateUtils";
import { useColors } from "../lib/theme";
import { TextField, fieldBox } from "./ui/TextField";
import { radii } from "../lib/radii";
import { SchedulePicker } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { StagedTaskDestinationPills } from "./StagedTaskDestinationPills";
import type { StagedTaskDestination } from "./StagedTaskDestinationPills";

interface Props {
  destination: StagedTaskDestination;
  onDestinationChange: (d: StagedTaskDestination) => void;
  title: string;
  onTitleChange: (v: string) => void;
  desc: string;
  onDescChange: (v: string) => void;
  date: string;
  today: string;
  onPickDate: () => void;
  sched: ScheduleType;
  onSchedChange: (s: ScheduleType) => void;
  days: number[];
  onDayToggle: (d: number) => void;
  disabled?: boolean;
}

/**
 * Where a staged task is going and when: destination, title, description, the
 * date button, and — for a routine — its repeat schedule.
 *
 * The wording changes with the destination, which is why these fields belong
 * together rather than beside the goal/spread options.
 */
export function ScheduleDestinationFields({
  destination,
  onDestinationChange,
  title,
  onTitleChange,
  desc,
  onDescChange,
  date,
  today,
  onPickDate,
  sched,
  onSchedChange,
  days,
  onDayToggle,
  disabled,
}: Props) {
  const c = useColors();
  const isRoutine = destination === "routine";

  const s = StyleSheet.create({
    mt: { marginTop: 10 },
    dateBtn: fieldBox(c),
    dateTxt: { fontSize: 14, color: c.t1 },
    hint: { fontSize: 11, color: c.t3, marginTop: 5, paddingHorizontal: 2 },
  });

  return (
    <>
      <StagedTaskDestinationPills
        value={destination}
        disabled={disabled}
        onChange={onDestinationChange}
      />
      <TextField
        style={s.mt}
        value={title}
        onChangeText={onTitleChange}
        placeholder={isRoutine ? "Routine name" : "Task title"}
        editable={!disabled}
      />
      <TextField
        style={s.mt}
        value={desc}
        onChangeText={onDescChange}
        placeholder="Description (optional)"
        editable={!disabled}
      />
      <TouchableOpacity
        style={[s.dateBtn, s.mt]}
        onPress={onPickDate}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={s.dateTxt}>{fmtLong(date)}</Text>
      </TouchableOpacity>
      <Text style={s.hint}>
        {isRoutine
          ? "The routine starts on this day."
          : "The task lands on your day on this date."}
        {date === today ? " Today means it's added right away." : ""}
      </Text>
      {isRoutine && (
        <View style={s.mt}>
          <SchedulePicker
            scheduleType={sched}
            customDays={days}
            disabled={disabled}
            onChange={onSchedChange}
            onDayToggle={onDayToggle}
          />
        </View>
      )}
    </>
  );
}
