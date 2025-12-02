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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const blinkApiKey = Deno.env.get('BLINK_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Creating Blink wallet for user:', user.id);

    // Call Blink API to get default wallet
    const blinkResponse = await fetch('https://api.blink.sv/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': blinkApiKey,
      },
      body: JSON.stringify({
        query: `
          query Me {
            me {
              defaultAccount {
                defaultWalletId
                wallets {
                  id
                  walletCurrency
                }
              }
            }
          }
        `
      })
    });

    const blinkData = await blinkResponse.json();
    console.log('Blink API response:', blinkData);

    if (blinkData.errors) {
      throw new Error(`Blink API error: ${JSON.stringify(blinkData.errors)}`);
    }

    const defaultWalletId = blinkData.data?.me?.defaultAccount?.defaultWalletId;
    
    if (!defaultWalletId) {
      throw new Error('Failed to get wallet ID from Blink');
    }

    // Update user profile with Blink wallet info
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bitcoin_wallet_type: 'internal',
        lightning_address: `${user.id}@crowdpay.me`, // Placeholder Lightning address
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log('Wallet created successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        walletId: defaultWalletId,
        lightningAddress: `${user.id}@crowdpay.me`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-blink-wallet:', error);
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
