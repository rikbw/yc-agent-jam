import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getAllPendingActions, getRecentlyCompletedActions } from "@/lib/actions";
import { TasksList } from "@/components/tasks-list";

export default async function TasksPage() {
  const [pendingResult, completedResult] = await Promise.all([
    getAllPendingActions(),
    getRecentlyCompletedActions(7),
  ]);

  const pendingActions = pendingResult.success ? pendingResult.actions : [];
  const completedActions = completedResult.success ? completedResult.actions : [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Deal Sourcing</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Tasks</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Scheduled Tasks</h1>
              <p className="text-muted-foreground">
                View and execute all scheduled follow-up tasks chronologically.
              </p>
            </div>
          </div>
          <TasksList
            pendingActions={pendingActions}
            completedActions={completedActions}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
