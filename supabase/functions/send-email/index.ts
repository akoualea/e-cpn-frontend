import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Récupération de la clé API Resend configurée dans les secrets Supabase
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Configuration des headers CORS pour permettre l'appel depuis votre site web
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Vous pourrez mettre 'http://e-cpn.iwajutech.com' après test
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion de la requête de pré-vérification CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // On récupère les données envoyées par votre Dashboard Admin
    // Note : On utilise 'html' car c'est ce que vous envoyez dans triggerEmail(to, subject, html)
    const { to, subject, html } = await req.json()

    // Appel à l'API de Resend pour l'envoi réel
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
       from: 'e-CPN Test <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html, // On injecte directement le code HTML reçu
      }),
    })

    const data = await res.json()

    // Retour de la réponse de succès vers l'application React
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    // Gestion des erreurs
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})