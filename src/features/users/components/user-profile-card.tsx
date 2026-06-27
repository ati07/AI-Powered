import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface UserProfileCardProps {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    imageUrl: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date | string;
  };
}

/**
 * Displays user profile information in a card layout.
 */
export function UserProfileCard({ user }: UserProfileCardProps) {
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.imageUrl ?? undefined} alt={user.fullName ?? "User"} />
          <AvatarFallback className="text-lg">{initials || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle>{user.fullName || "Unnamed User"}</CardTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
            {user.role}
          </Badge>
          <Badge variant={user.isActive ? "success" : "destructive"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Joined {formatDate(user.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
