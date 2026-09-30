import React, { useState, useEffect } from "react";

export function useUserData(userId: string) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then((r) => r.json()).then(setUser);
  }, [userId]);
  return user;
}

export function UserProfileCard({ userId }: { userId: string }) {
  const user = useUserData(userId);

  if (!user) {
    return <div className="loading">Loading user...</div>;
  }

  return (
    <div className="user-profile">
      <h1>{user.fullName}</h1>
      <p>{user.email}</p>
    </div>
  );
}
