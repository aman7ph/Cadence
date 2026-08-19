import { useClerk, useUser } from "@clerk/clerk-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Section } from "./settings-section";

export function AccountSection() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const displayName =
    user?.fullName ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Signed in";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <Section title="Account">
      <div className="flex items-center gap-4">
        <Avatar name={displayName} src={user?.imageUrl} size={52} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold leading-snug text-foreground">
            {displayName}
          </div>
          {email && (
            <div className="mt-0.5 truncate text-[12px] text-[var(--text-secondary)]">
              {email}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <Button variant="danger" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </Section>
  );
}
