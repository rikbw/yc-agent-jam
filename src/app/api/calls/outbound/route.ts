import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCall } from "@/lib/calls";
import { vapiSystemPrompt } from "@/lib/vapi/vapi";
import { vapiTools } from "@/lib/vapi/tools";

/**
 * POST /api/calls/outbound
 * Initiates an outbound phone call via Vapi API
 *
 * Body:
 * - companyId: string - The seller company to call
 * - phoneNumber: string - Phone number in E.164 format (e.g., "+13243244444")
 */
export async function POST(request: NextRequest) {
  try {
    const { companyId, phoneNumber } = await request.json();

    // Validate inputs
    if (!companyId || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields: companyId and phoneNumber" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic E.164 check)
    if (!/^\+\d{10,15}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use E.164 format: +13243244444" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.VAPI_PRIVATE_API_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!process.env.VAPI_PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: "VAPI_PHONE_NUMBER_ID not configured" },
        { status: 500 }
      );
    }

    // Fetch company data with banker info
    const company = await prisma.sellerCompany.findUnique({
      where: { id: companyId },
      include: {
        ownerBanker: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Fetch previous call summaries for context
    const previousCalls = await prisma.call.findMany({
      where: {
        sellerCompanyId: companyId,
        summary: { not: null },
      },
      orderBy: { callDate: "desc" },
      take: 5,
      select: { summary: true },
    });

    const previousConversationSummaries = previousCalls
      .map((call) => call.summary)
      .filter((summary): summary is string => summary !== null);

    // Create call record in database first
    const callResult = await createCall(companyId, company.ownerBankerId);

    if (!callResult.success || !callResult.callId) {
      return NextResponse.json(
        { error: callResult.error || "Failed to create call record" },
        { status: 500 }
      );
    }

    const callId = callResult.callId;

    // Format company data for the assistant
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    const companyInfo = `
Company: ${company.name}
Industry: ${company.industry}
Geography: ${company.geography}
Revenue: ${formatCurrency(company.revenue)}
EBITDA: ${formatCurrency(company.ebitda)}
Headcount: ${company.headcount.toLocaleString()}
Deal Stage: ${company.dealStage}
Estimated Deal Size: ${formatCurrency(company.estimatedDealSize)}
Likelihood to Sell: ${company.likelihoodToSell}%
Owner: ${company.ownerBanker.name}
    `.trim();

    // Generate system prompt using existing function
    const systemPrompt = vapiSystemPrompt({
      ownerBankerName: company.ownerBanker.name,
      companyName: company.name,
      companyInfo: companyInfo,
      previousConversationSummaries,
    });

    // Prepare Vapi API request - same config as web calls but wrapped in assistant object
    const vapiPayload = {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
      },
      assistant: {
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
          ],
          tools: vapiTools,
        },
        voice: {
          provider: "cartesia",
          voiceId: "57dcab65-68ac-45a6-8480-6c4c52ec1cd1", // Kira - warm, engaging voice
        },
        backgroundSound: "office",
        maxDurationSeconds: 900,
        name: `${company.name} Sales Call`,
        firstMessage: `Hi, thanks for taking my call. I'm reaching out on behalf of ${company.ownerBanker.name}—he's a partner at our equity investments firm. He specifically asked me to connect with you because he's been following ${company.name} and was impressed by your market position. I was curious, when his team reached out, what caught your attention?`,
      },
    };

    console.log("Initiating outbound call to", phoneNumber, "for company", company.name);
    console.log("Call will be tracked with ID:", callId);

    // Make request to Vapi API
    const vapiResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vapiPayload),
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("Vapi API error:", vapiResponse.status, errorText);

      // Delete the call record since we failed to initiate
      await prisma.call.delete({ where: { id: callId } });

      return NextResponse.json(
        { error: `Failed to initiate call: ${errorText}` },
        { status: vapiResponse.status }
      );
    }

    const vapiCall = await vapiResponse.json();

    console.log("Call initiated successfully:", vapiCall.id);

    // Store Vapi call ID in our database for webhook lookup
    await prisma.call.update({
      where: { id: callId },
      data: {
        notes: `Vapi Call ID: ${vapiCall.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      callId,
      vapiCallId: vapiCall.id,
      phoneNumber,
      message: "Call initiated successfully",
      webhookNote: "Configure webhook URL in Vapi dashboard: " + (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/vapi/webhook` : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/vapi/webhook`),
    });
  } catch (error) {
    console.error("Error initiating outbound call:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to initiate call",
      },
      { status: 500 }
    );
  }
}
