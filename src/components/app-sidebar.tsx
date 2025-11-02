import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Platform navigation data
const data = {
  versions: ["v1.0.0"],
  navMain: [
    {
      title: "Deal Sourcing",
      url: "#",
      items: [
        {
          title: "Seller Dataset",
          url: "#",
        },
        {
          title: "Seller CRM",
          url: "#",
          isActive: true,
        },
        {
          title: "Staffing & Allocation",
          url: "#",
        },
      ],
    },
    {
      title: "Deal Process",
      url: "#",
      items: [
        {
          title: "Process Flow",
          url: "#",
        },
        {
          title: "Data Room",
          url: "#",
        },
        {
          title: "Buyer Dataset",
          url: "#",
        },
      ],
    },
    {
      title: "Material Creation",
      url: "#",
      items: [
        {
          title: "Deal Documents",
          url: "#",
        },
        {
          title: "Legal Templates",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
