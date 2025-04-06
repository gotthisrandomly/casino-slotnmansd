import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { amount, userId } = data

    if (!amount || !userId) {
      return NextResponse.json({ error: "Amount and user ID are required" }, { status: 400 })
    }

    // Validate the request
    const validation = await validateRequest(request)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    // Check if the user is authorized
    if (validation.userId !== userId && !validation.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the user
    const user = await db.getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Slot King Casino Deposit",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=canceled`,
      metadata: {
        userId,
        type: "deposit",
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating Stripe checkout:", error)
    return NextResponse.json({ error: "Failed to create Stripe checkout" }, { status: 500 })
  }
}

