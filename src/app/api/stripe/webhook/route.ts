/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, admin)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, admin)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, admin)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, admin)
        break
    }
  } catch (err) {
    console.error('[Stripe webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, admin: any) {
  const userId = session.metadata?.supabase_user_id
  if (!userId || !session.subscription || !session.customer) return

  const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string)
  const plan = stripeSub.metadata?.plan ?? 'pro'

  await (admin.from('subscriptions') as any).upsert({
    user_id: userId,
    stripe_subscription_id: stripeSub.id,
    stripe_customer_id: session.customer as string,
    plan,
    status: stripeSub.status,
    current_period_start: new Date((stripeSub as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((stripeSub as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: stripeSub.cancel_at_period_end,
  }, { onConflict: 'user_id' })
}

async function handleSubscriptionChange(sub: Stripe.Subscription, admin: any) {
  const userId = sub.metadata?.supabase_user_id
  if (!userId) return

  await (admin.from('subscriptions') as any).upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer as string,
    plan: sub.metadata?.plan ?? 'pro',
    status: sub.status,
    current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
  }, { onConflict: 'user_id' })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription, admin: any) {
  await (admin.from('subscriptions') as any)
    .update({ plan: 'free', status: 'canceled', stripe_subscription_id: null })
    .eq('stripe_subscription_id', sub.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice, admin: any) {
  const subscriptionId = (invoice as any).subscription
  if (!subscriptionId) return
  await (admin.from('subscriptions') as any)
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId)
}
