"use server";

import { prisma } from "@/lib/prisma";
import { ActionType, ActionStatus } from "@/generated/prisma/client";

/**
 * Creates a new action for a seller company
 * @param sellerCompanyId - The ID of the seller company
 * @param actionType - The type of action (currently only "call")
 * @param scheduledFor - When the action should be performed
 * @param title - Title/description of the action
 * @param description - Optional detailed description
 * @returns The created action record
 */
export async function createAction(
  sellerCompanyId: string,
  actionType: ActionType,
  scheduledFor: Date,
  title: string,
  description?: string
) {
  try {
    const action = await prisma.action.create({
      data: {
        sellerCompanyId,
        actionType,
        scheduledFor,
        title,
        description,
        status: "pending",
      },
    });

    console.log(`Created action ${action.id} for company ${sellerCompanyId}`);
    return { success: true, action };
  } catch (error) {
    console.error("Error creating action:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create action",
    };
  }
}

/**
 * Marks an action as completed
 * @param actionId - The ID of the action to complete
 * @returns The updated action record
 */
export async function completeAction(actionId: string) {
  try {
    const action = await prisma.action.update({
      where: { id: actionId },
      data: { status: "completed" },
    });

    console.log(`Completed action ${actionId}`);
    return { success: true, action };
  } catch (error) {
    console.error("Error completing action:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to complete action",
    };
  }
}

/**
 * Gets all pending actions for a seller company
 * @param sellerCompanyId - The seller company ID
 * @param includeFuture - Whether to include future actions (default: false, only current/overdue)
 * @returns Array of pending actions
 */
export async function getCompanyActions(
  sellerCompanyId: string,
  includeFuture: boolean = false
) {
  try {
    const now = new Date();

    const actions = await prisma.action.findMany({
      where: {
        sellerCompanyId,
        status: "pending",
        ...(includeFuture
          ? {}
          : {
              scheduledFor: {
                lte: now,
              },
            }),
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return { success: true, actions };
  } catch (error) {
    console.error("Error fetching actions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch actions",
      actions: [],
    };
  }
}

/**
 * Gets all pending actions for a seller company, separated by current and upcoming
 * @param sellerCompanyId - The seller company ID
 * @returns Object with current and upcoming actions
 */
export async function getCompanyActionsSeparated(sellerCompanyId: string) {
  try {
    const now = new Date();

    const allActions = await prisma.action.findMany({
      where: {
        sellerCompanyId,
        status: "pending",
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    const current = allActions.filter((action) => action.scheduledFor <= now);
    const upcoming = allActions.filter((action) => action.scheduledFor > now);

    return { success: true, current, upcoming };
  } catch (error) {
    console.error("Error fetching separated actions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch separated actions",
      current: [],
      upcoming: [],
    };
  }
}
