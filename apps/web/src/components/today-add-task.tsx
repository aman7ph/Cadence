import { useState } from "react";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import {
  EMPTY_ITEM_OPTIONS,
  ItemOptionsFields,
  itemOptionsToArgs,
  type ItemOptions,
} from "./item-options-fields";

/**
 * Today's add action. It sits between the routines list and the tasks list
 * rather than in the page header (D19): Today has two lists, so a header button
 * would not say which one it adds to.
 *
 * The form itself is the shared drawer (D17). The inline quick-add the
 * prototype shows is deliberately gone — the user chose consistency with every
 * other create action over fidelity to the mock.
 */
export function TodayAddTask({ viewedDate }: { viewedDate: string }) {
  const create = useMutation(api.dailyTasks.create);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<ItemOptions>(EMPTY_ITEM_OPTIONS);

  const reset = () => {
    setTitle("");
    setOptions(EMPTY_ITEM_OPTIONS);
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New task
        </Button>
      </div>

      <FormDrawer
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
        title="New task"
        description="One-off work for today. Link it to a goal or spread it across the day if you want."
        submitLabel="Add task"
        submitDisabled={!title.trim()}
        onSubmit={async () => {
          await create({
            title: title.trim(),
            today: viewedDate,
            ...itemOptionsToArgs(options),
          });
          reset();
        }}
      >
        <Input
          placeholder="What needs doing today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <ItemOptionsFields value={options} onChange={setOptions} />
      </FormDrawer>
    </>
  );
}
