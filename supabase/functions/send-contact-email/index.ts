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

    // Input validation and sanitization
    if (!to || !senderEmail || !topic || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || !emailRegex.test(senderEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize and validate inputs
    const sanitizedMessage = message.slice(0, 5000).replace(/[<>]/g, ''); // Remove HTML tags, limit length
    const sanitizedSenderEmail = senderEmail.slice(0, 100);
    const sanitizedTopic = topic.slice(0, 50);

    // Validate topic is one of allowed values
    const allowedTopics = ['suggest-feature', 'report-problem', 'corporate-rate'];
    if (!allowedTopics.includes(sanitizedTopic)) {
      return new Response(
        JSON.stringify({ error: "Invalid topic" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Map topic values to readable subjects
    const topicMap: { [key: string]: string } = {
      'suggest-feature': 'Feature Suggestion',
      'report-problem': 'Problem Report',
      'corporate-rate': 'Corporate Rate Inquiry'
    };

    const subject = `NinjaDo Contact: ${topicMap[sanitizedTopic]}`;

    const emailResponse = await resend.emails.send({
      from: "NinjaDo Contact <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${sanitizedSenderEmail}</p>
        <p><strong>Topic:</strong> ${topicMap[sanitizedTopic]}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
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