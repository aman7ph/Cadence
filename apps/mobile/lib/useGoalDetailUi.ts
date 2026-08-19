import { useState } from "react";

function tsToDateStr(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

/** Midday anchor, so a DST jump cannot land the result on the wrong date. */
export function shiftDate(d: string, n: number) {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

export type GoalConfirm = "complete" | "abandon" | "delete" | null;

/**
 * Which overlay the goal detail page currently has open, plus the day it is
 * showing.
 *
 * Six independent `useState` calls and the date bounds derived from them used
 * to sit in the page body between its queries and its markup. Grouping them
 * also collapses what the sheets need from twenty props to one.
 */
export function useGoalDetailUi(
  today: string,
  createdAt: number,
  completedAt: number | undefined,
) {
  const [confirm, setConfirm] = useState<GoalConfirm>(null);
  const [selDate, setSelDate] = useState(today);
  const [editKey, setEditKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return {
    confirm,
    setConfirm,
    selDate,
    setSelDate,
    stepDay: (n: number) => setSelDate((d) => shiftDate(d, n)),

    minDate: tsToDateStr(createdAt),
    maxDate: completedAt ? tsToDateStr(completedAt) : today,

    editKey,
    editOpen,
    // A fresh key each time, so the form remounts with the goal's current
    // values instead of whatever was last typed into it.
    openEdit: () => {
      setEditKey((k) => k + 1);
      setEditOpen(true);
    },
    closeEdit: () => setEditOpen(false),

    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),

    menuOpen,
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
  };
}

export type GoalDetailUi = ReturnType<typeof useGoalDetailUi>;
