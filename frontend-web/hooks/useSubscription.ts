import { useEffect, useState } from "react";

import api from "../services/api";

export default function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    api
      .get(`/subscriptions/user/${userId}/active`)
      .then((res) => setSubscription(res.data))
      .catch(() => setSubscription(null));
  }, [userId]);

  return subscription;
}
