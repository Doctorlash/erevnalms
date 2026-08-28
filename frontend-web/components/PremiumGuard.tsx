import { ReactNode } from "react";

export default function PremiumGuard({
  subscription,
  children,
}: {
  subscription: any;
  children: ReactNode;
}) {
  if (!subscription || subscription.plan === "FREE") {
    return (
      <div className="bg-yellow-100 border p-6 rounded">
        <h2 className="font-bold">Premium Content</h2>

        <p>Upgrade your subscription to access this content.</p>
      </div>
    );
  }

  return <>{children}</>;
}
