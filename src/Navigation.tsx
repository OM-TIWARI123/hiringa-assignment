import { Home, Building2, History, User } from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter
} from "./components/ui/sidebar";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignOutButton } from "./SignOutButton";


export function Navigation({
  currentTab,
  onTabChange,
}: {
  currentTab: "home" | "company" | "history" | "editPhoto";
  onTabChange: (tab: "home" | "company" | "history" | "editPhoto") => void;
}) {
  const user = useQuery(api.auth.loggedInUser);

  const campaigns=useQuery(api.campaigns.list)??[]

  return (
    <>
      <SidebarHeader className="h-14 flex items-center justify-center border-b">
        <h2 className="text-lg font-semibold text-sidebar-foreground">AI Marketing Agent</h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onTabChange("home")}
                isActive={currentTab === "home"}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onTabChange("company")}
                isActive={currentTab === "company"}
              >
                <Building2 className="w-4 h-4" />
                <span>Company Assets</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onTabChange("history")}
                isActive={currentTab === "history"}
              >
                <History className="w-4 h-4" />
                <span>Campaign History</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onTabChange("editPhoto")}
                isActive={currentTab === "editPhoto"}
              >
                <History className="w-4 h-4" />
                <span>Edit Photo</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <div className="flex-1" />

      <SidebarFooter className="mt-auto border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.email || 'User'}</p>
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
          <SignOutButton />
        </div>
      </SidebarFooter>
    </>
  );
}
