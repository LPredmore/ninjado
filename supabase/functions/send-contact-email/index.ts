import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  to: string;
  from: string;
  topic: string;
  message: string;
  senderEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, from, topic, message, senderEmail }: ContactEmailRequest = await req.json();

    // Map topic values to readable subjects
    const topicMap: { [key: string]: string } = {
      'suggest-feature': 'Feature Suggestion',
      'report-problem': 'Problem Report',
      'corporate-rate': 'Corporate Rate Inquiry',
      'unsubscribe': 'Unsubscribe Request'
    };

    const subject = `NinjaDo Contact: ${topicMap[topic] || topic}`;

    const emailResponse = await resend.emails.send({
      from: "NinjaDo Contact <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${senderEmail}</p>
        <p><strong>Topic:</strong> ${topicMap[topic] || topic}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>This message was sent via the NinjaDo contact form.</small></p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);