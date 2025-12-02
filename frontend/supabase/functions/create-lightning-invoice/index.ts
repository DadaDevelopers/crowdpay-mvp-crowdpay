import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, amount } = await req.json();
    
    if (!campaignId || !amount) {
      throw new Error('Campaign ID and amount are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const blinkApiKey = Deno.env.get('BLINK_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    console.log('Creating Lightning invoice for campaign:', campaignId, 'Amount:', amount);

    // Convert amount to satoshis (assuming amount is in KES or USD, need conversion)
    // For now, treat amount as satoshis directly
    const amountInSats = Math.floor(amount);

    // Call Blink API to create Lightning invoice
    const blinkResponse = await fetch('https://api.blink.sv/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': blinkApiKey,
      },
      body: JSON.stringify({
        query: `
          mutation LnInvoiceCreate($input: LnInvoiceCreateInput!) {
            lnInvoiceCreate(input: $input) {
              invoice {
                paymentRequest
                paymentHash
                paymentSecret
                satoshis
              }
              errors {
                message
              }
            }
          }
        `,
        variables: {
          input: {
            amount: amountInSats,
            memo: `Contribution to ${campaign.title}`,
          }
        }
      })
    });

    const blinkData = await blinkResponse.json();
    console.log('Blink invoice response:', blinkData);

    if (blinkData.errors || blinkData.data?.lnInvoiceCreate?.errors) {
      const errorMsg = blinkData.errors?.[0]?.message || 
                      blinkData.data?.lnInvoiceCreate?.errors?.[0]?.message || 
                      'Unknown error';
      throw new Error(`Blink API error: ${errorMsg}`);
    }

    const invoice = blinkData.data?.lnInvoiceCreate?.invoice;
    
    if (!invoice?.paymentRequest) {
      throw new Error('Failed to create Lightning invoice');
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice: invoice.paymentRequest,
        paymentHash: invoice.paymentHash,
        amount: invoice.satoshis,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-lightning-invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
