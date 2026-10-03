// frontend/src/components/UI/SetupNotice.jsx
import React from "react";
import { DatabaseZap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";

/** Shown when a feature's database tables haven't been created yet (migration not applied). */
const SetupNotice = ({ feature, migration }) => (
  <Alert variant="warning" className="items-start">
    <DatabaseZap aria-hidden="true" />
    <div className="space-y-1">
      <AlertTitle>{feature} needs a one-time database update</AlertTitle>
      <AlertDescription>
        The project owner needs to apply <code className="rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-white/10">{migration}</code>{" "}
        to the Supabase database (<code className="rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-white/10">supabase db push</code>).
        Everything else in ApeXfit keeps working in the meantime.
      </AlertDescription>
    </div>
  </Alert>
);

export default SetupNotice;
