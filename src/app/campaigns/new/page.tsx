"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { createCampaign } from "../actions";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const EMPLOYEE_RANGES = [
  { value: "1,10", label: "1-10 employees" },
  { value: "11,50", label: "11-50 employees" },
  { value: "51,200", label: "51-200 employees" },
  { value: "201,500", label: "201-500 employees" },
  { value: "501,1000", label: "501-1,000 employees" },
  { value: "1001,2000", label: "1,001-2,000 employees" },
  { value: "2001,5000", label: "2,001-5,000 employees" },
  { value: "5001,10000", label: "5,001-10,000 employees" },
  { value: "10001+", label: "10,001+ employees" },
];

const FUNDING_STAGES = [
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
  { value: "ipo", label: "IPO/Public" },
];

const SENIORITIES = [
  { value: "executive", label: "Executive" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
];

interface Location {
  city?: string;
  state?: string;
  country?: string;
}

interface FormState {
  locations: Location[];
  employeeRanges: string[];
  revenueRange: [number, number];
  keywords: string[];
  fundingStages: string[];
  jobTitles: string[];
  seniorities: string[];
  foundedYearRange: [number, number];
  perPage: number;
}

export default function NewCampaignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [rawJson, setRawJson] = useState("");

  const currentYear = new Date().getFullYear();
  const [formState, setFormState] = useState<FormState>({
    locations: [],
    employeeRanges: [],
    revenueRange: [0, 100000000],
    keywords: [],
    fundingStages: [],
    jobTitles: [],
    seniorities: [],
    foundedYearRange: [1950, currentYear],
    perPage: 25,
  });

  // Collapsible state for each section
  const [expandedSections, setExpandedSections] = useState({
    locations: false,
    employeeRanges: false,
    revenue: false,
    keywords: false,
    fundingStages: false,
    jobTitles: false,
    seniorities: false,
    foundedYear: false,
    perPage: false,
    advanced: false,
  });

  useEffect(() => {
    const name = searchParams.get("name");
    const description = searchParams.get("description");
    const paramsJson = searchParams.get("params");

    if (!name || !paramsJson) {
      router.push("/campaigns");
      return;
    }

    try {
      const parsed = JSON.parse(paramsJson);
      setRawJson(JSON.stringify(parsed, null, 2));

      // Parse JSON into form state
      const newFormState = {
        locations: parsed.organization_locations || [],
        employeeRanges: parsed.organization_num_employees_ranges || [],
        revenueRange: [
          parsed.revenue_range?.min || 0,
          parsed.revenue_range?.max || 100000000,
        ] as [number, number],
        keywords: parsed.q_organization_keyword_tags || [],
        fundingStages: parsed.organization_latest_funding_stage_cd || [],
        jobTitles: parsed.person_titles || [],
        seniorities: parsed.person_seniorities || [],
        foundedYearRange: [
          parsed.founded_year_min || 1950,
          parsed.founded_year_max || currentYear,
        ] as [number, number],
        perPage: parsed.per_page || 25,
      };

      setFormState(newFormState);

      // Expand sections that have data
      setExpandedSections({
        locations: (newFormState.locations?.length || 0) > 0,
        employeeRanges: (newFormState.employeeRanges?.length || 0) > 0,
        revenue: (parsed.revenue_range?.min || 0) > 0 || (parsed.revenue_range?.max || 100000000) < 100000000,
        keywords: (newFormState.keywords?.length || 0) > 0,
        fundingStages: (newFormState.fundingStages?.length || 0) > 0,
        jobTitles: (newFormState.jobTitles?.length || 0) > 0,
        seniorities: (newFormState.seniorities?.length || 0) > 0,
        foundedYear: (parsed.founded_year_min || 1950) > 1950 || (parsed.founded_year_max || currentYear) < currentYear,
        perPage: (parsed.per_page || 25) !== 25,
        advanced: false,
      });
    } catch (e) {
      console.error("Failed to parse params:", e);
      router.push("/campaigns");
    }
  }, [searchParams, router, currentYear]);

  // Convert form state back to API params
  const buildSearchParams = () => {
    const params: any = {
      page: 1,
      per_page: formState.perPage,
    };

    if (formState.locations.length > 0) {
      params.organization_locations = formState.locations;
    }
    if (formState.employeeRanges.length > 0) {
      params.organization_num_employees_ranges = formState.employeeRanges;
    }
    if (formState.revenueRange[0] > 0 || formState.revenueRange[1] < 100000000) {
      params.revenue_range = {
        min: formState.revenueRange[0],
        max: formState.revenueRange[1],
      };
    }
    if (formState.keywords.length > 0) {
      params.q_organization_keyword_tags = formState.keywords;
    }
    if (formState.fundingStages.length > 0) {
      params.organization_latest_funding_stage_cd = formState.fundingStages;
    }
    if (formState.jobTitles.length > 0) {
      params.person_titles = formState.jobTitles;
    }
    if (formState.seniorities.length > 0) {
      params.person_seniorities = formState.seniorities;
    }
    if (formState.foundedYearRange[0] > 1950 || formState.foundedYearRange[1] < currentYear) {
      params.founded_year_min = formState.foundedYearRange[0];
      params.founded_year_max = formState.foundedYearRange[1];
    }

    return params;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  async function handleCreateCampaign() {
    setIsCreating(true);
    try {
      const name = searchParams.get("name")!;
      const description = searchParams.get("description") || "";
      const params = expandedSections.advanced ? JSON.parse(rawJson) : buildSearchParams();

      await createCampaign(name, description, params);
      router.push("/campaigns");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign. Please check the parameters and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const addLocation = () => {
    updateFormState({
      locations: [...formState.locations, { city: "", state: "", country: "" }],
    });
  };

  const updateLocation = (index: number, field: keyof Location, value: string) => {
    const newLocations = [...formState.locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    updateFormState({ locations: newLocations });
  };

  const removeLocation = (index: number) => {
    updateFormState({
      locations: formState.locations.filter((_, i) => i !== index),
    });
  };

  const name = searchParams.get("name") || "";
  const description = searchParams.get("description") || "";

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
              <BreadcrumbItem>
                <BreadcrumbLink href="/campaigns">Campaigns</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Review Parameters</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              disabled={isCreating}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Review Campaign Parameters</h1>
              <p className="text-sm text-muted-foreground">
                Review and adjust the generated search parameters before creating the campaign.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Campaign Name</h3>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
            {description && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Description</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4 max-w-3xl">
            <h3 className="text-lg font-semibold">Search Parameters</h3>

            {/* Locations */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("locations")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Locations</h4>
                  <p className="text-xs text-muted-foreground">Filter by company headquarters location</p>
                </div>
                {expandedSections.locations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.locations && (
                <div className="mt-3 space-y-3">
                {formState.locations.map((location, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`city-${index}`} className="text-xs">City</Label>
                        <Input
                          id={`city-${index}`}
                          value={location.city || ""}
                          onChange={(e) => updateLocation(index, "city", e.target.value)}
                          placeholder="San Francisco"
                          disabled={isCreating}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`state-${index}`} className="text-xs">State</Label>
                        <Input
                          id={`state-${index}`}
                          value={location.state || ""}
                          onChange={(e) => updateLocation(index, "state", e.target.value)}
                          placeholder="California"
                          disabled={isCreating}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`country-${index}`} className="text-xs">Country</Label>
                        <Input
                          id={`country-${index}`}
                          value={location.country || ""}
                          onChange={(e) => updateLocation(index, "country", e.target.value)}
                          placeholder="United States"
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLocation(index)}
                      disabled={isCreating}
                      className="mt-6"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLocation}
                    disabled={isCreating}
                  >
                    Add Location
                  </Button>
                </div>
              )}
            </div>

            {/* Employee Count */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("employeeRanges")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Company Size</h4>
                  <p className="text-xs text-muted-foreground">Filter by number of employees</p>
                </div>
                {expandedSections.employeeRanges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.employeeRanges && (
                <div className="mt-3">
                <div className="grid grid-cols-2 gap-3">
                  {EMPLOYEE_RANGES.map((range) => (
                    <div key={range.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`employee-${range.value}`}
                        checked={formState.employeeRanges.includes(range.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormState({
                              employeeRanges: [...formState.employeeRanges, range.value],
                            });
                          } else {
                            updateFormState({
                              employeeRanges: formState.employeeRanges.filter((r) => r !== range.value),
                            });
                          }
                        }}
                        disabled={isCreating}
                      />
                      <Label
                        htmlFor={`employee-${range.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {range.label}
                      </Label>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>

            {/* Revenue Range */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("revenue")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Revenue Range</h4>
                  <p className="text-xs text-muted-foreground">
                    ${(formState.revenueRange[0] / 1000000).toFixed(1)}M - ${(formState.revenueRange[1] / 1000000).toFixed(1)}M
                  </p>
                </div>
                {expandedSections.revenue ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.revenue && (
                <div className="mt-3 space-y-4">
                <Slider
                  min={0}
                  max={100000000}
                  step={1000000}
                  value={formState.revenueRange}
                  onValueChange={(value) => updateFormState({ revenueRange: value as [number, number] })}
                  disabled={isCreating}
                  className="py-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="revenue-min" className="text-xs">Minimum Revenue</Label>
                    <Input
                      id="revenue-min"
                      type="number"
                      value={formState.revenueRange[0]}
                      onChange={(e) => updateFormState({ revenueRange: [parseInt(e.target.value) || 0, formState.revenueRange[1]] })}
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="revenue-max" className="text-xs">Maximum Revenue</Label>
                    <Input
                      id="revenue-max"
                      type="number"
                      value={formState.revenueRange[1]}
                      onChange={(e) => updateFormState({ revenueRange: [formState.revenueRange[0], parseInt(e.target.value) || 100000000] })}
                      disabled={isCreating}
                    />
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("keywords")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Industry Keywords</h4>
                  <p className="text-xs text-muted-foreground">Add keywords to filter by industry or business type</p>
                </div>
                {expandedSections.keywords ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.keywords && (
                <div className="mt-3">
                <TagInput
                  value={formState.keywords}
                  onChange={(keywords) => updateFormState({ keywords })}
                  placeholder="Type a keyword and press Enter (e.g., SaaS, Software, B2B)"
                />
                </div>
              )}
            </div>

            {/* Funding Stage */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("fundingStages")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Funding Stage</h4>
                  <p className="text-xs text-muted-foreground">Filter by latest funding round</p>
                </div>
                {expandedSections.fundingStages ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.fundingStages && (
                <div className="mt-3">
                <div className="grid grid-cols-2 gap-3">
                  {FUNDING_STAGES.map((stage) => (
                    <div key={stage.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`funding-${stage.value}`}
                        checked={formState.fundingStages.includes(stage.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormState({
                              fundingStages: [...formState.fundingStages, stage.value],
                            });
                          } else {
                            updateFormState({
                              fundingStages: formState.fundingStages.filter((s) => s !== stage.value),
                            });
                          }
                        }}
                        disabled={isCreating}
                      />
                      <Label
                        htmlFor={`funding-${stage.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {stage.label}
                      </Label>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>

            {/* Job Titles */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("jobTitles")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Target Job Titles</h4>
                  <p className="text-xs text-muted-foreground">Add job titles to target specific decision makers</p>
                </div>
                {expandedSections.jobTitles ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.jobTitles && (
                <div className="mt-3">
                <TagInput
                  value={formState.jobTitles}
                  onChange={(jobTitles) => updateFormState({ jobTitles })}
                  placeholder="Type a job title and press Enter (e.g., CEO, CTO, VP Sales)"
                />
                </div>
              )}
            </div>

            {/* Seniorities */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("seniorities")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Seniority Level</h4>
                  <p className="text-xs text-muted-foreground">Filter contacts by seniority level</p>
                </div>
                {expandedSections.seniorities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.seniorities && (
                <div className="mt-3">
                <div className="grid grid-cols-2 gap-3">
                  {SENIORITIES.map((seniority) => (
                    <div key={seniority.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`seniority-${seniority.value}`}
                        checked={formState.seniorities.includes(seniority.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormState({
                              seniorities: [...formState.seniorities, seniority.value],
                            });
                          } else {
                            updateFormState({
                              seniorities: formState.seniorities.filter((s) => s !== seniority.value),
                            });
                          }
                        }}
                        disabled={isCreating}
                      />
                      <Label
                        htmlFor={`seniority-${seniority.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {seniority.label}
                      </Label>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>

            {/* Founded Year */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("foundedYear")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Founded Year Range</h4>
                  <p className="text-xs text-muted-foreground">
                    {formState.foundedYearRange[0]} - {formState.foundedYearRange[1]}
                  </p>
                </div>
                {expandedSections.foundedYear ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.foundedYear && (
                <div className="mt-3 space-y-4">
                <Slider
                  min={1950}
                  max={currentYear}
                  step={1}
                  value={formState.foundedYearRange}
                  onValueChange={(value) => updateFormState({ foundedYearRange: value as [number, number] })}
                  disabled={isCreating}
                  className="py-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year-min" className="text-xs">From Year</Label>
                    <Input
                      id="year-min"
                      type="number"
                      value={formState.foundedYearRange[0]}
                      onChange={(e) => updateFormState({ foundedYearRange: [parseInt(e.target.value) || 1950, formState.foundedYearRange[1]] })}
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year-max" className="text-xs">To Year</Label>
                    <Input
                      id="year-max"
                      type="number"
                      value={formState.foundedYearRange[1]}
                      onChange={(e) => updateFormState({ foundedYearRange: [formState.foundedYearRange[0], parseInt(e.target.value) || currentYear] })}
                      disabled={isCreating}
                    />
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* Results Per Page */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => toggleSection("perPage")}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Results Per Page</h4>
                  <p className="text-xs text-muted-foreground">Number of companies to fetch (max 100)</p>
                </div>
                {expandedSections.perPage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.perPage && (
                <div className="mt-3">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formState.perPage}
                  onChange={(e) => updateFormState({ perPage: parseInt(e.target.value) || 25 })}
                  disabled={isCreating}
                  className="max-w-xs"
                />
                </div>
              )}
            </div>

            {/* Advanced: Raw JSON Editor */}
            <div className="border-b pb-3">
              <button
                type="button"
                onClick={() => {
                  if (!expandedSections.advanced) {
                    // Update raw JSON when opening advanced mode
                    setRawJson(JSON.stringify(buildSearchParams(), null, 2));
                  }
                  toggleSection("advanced");
                }}
                className="w-full flex items-center justify-between text-left hover:opacity-70"
                disabled={isCreating}
              >
                <div>
                  <h4 className="font-medium">Advanced: Raw JSON Editor</h4>
                  <p className="text-xs text-muted-foreground">Edit the raw JSON for advanced parameters</p>
                </div>
                {expandedSections.advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.advanced && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={rawJson}
                    onChange={(e) => setRawJson(e.target.value)}
                    className="font-mono text-xs min-h-[300px]"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    When using raw JSON, the form values above will be ignored.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end max-w-3xl">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? "Creating Campaign..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
