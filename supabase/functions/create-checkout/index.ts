import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || ''

  try {
    // Get the user's JWT from the request headers
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Get the user's email from their JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user?.email) {
      throw new Error('No email found')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    console.log('Creating checkout session for email:', user.email)

    // Find or create customer
    let customerId: string | undefined
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      
      // Check if customer already has an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        price: 'price_1QgR91DYSfbOmyKLcwYN99y6',
        limit: 1
      })

      if (subscriptions.data.length > 0) {
        throw new Error("You already have an active subscription")
      }
    }

    console.log('Creating payment session...')
    const origin = req.headers.get('origin')
    const baseUrl = origin && origin === FRONTEND_URL ? origin : FRONTEND_URL
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: 'price_1QgR91DYSfbOmyKLcwYN99y6',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/`,
      cancel_url: `${req.headers.get('origin')}/`,
      success_url: `${baseUrl}/`,
      cancel_url: `${baseUrl}/`,
    })

    console.log('Payment session created:', session.id)
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating payment session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
