import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      investor_email, 
      investor_name,
      business_name,
      tagline,
      pitch_deck_summary,
      founder_name,
      founder_email,
      custom_message
    } = await req.json();

    if (!investor_email || !business_name) {
      return Response.json({ 
        error: 'Missing required fields: investor_email and business_name' 
      }, { status: 400 });
    }

    // Create email content
    const emailSubject = `Investment Opportunity: ${business_name}`;
    
    const emailBody = `
Dear ${investor_name || 'Investor'},

I hope this email finds you well. I'm reaching out to introduce ${business_name}, ${tagline || 'an exciting new venture'}.

${custom_message || `We believe our company aligns well with your investment thesis and portfolio. We're building something truly transformative in the ${pitch_deck_summary?.industry || 'technology'} space.`}

${pitch_deck_summary ? `

KEY HIGHLIGHTS:
• Problem: ${pitch_deck_summary.problem || 'Solving a critical market need'}
• Solution: ${pitch_deck_summary.solution || 'Innovative technology platform'}
• Market Size: ${pitch_deck_summary.market_size || 'Large and growing market'}
• Traction: ${pitch_deck_summary.traction || 'Early customer validation'}
• Team: ${pitch_deck_summary.team || 'Experienced founding team'}

` : ''}

I'd love the opportunity to share more details about our vision, traction, and go-to-market strategy. Would you be open to a brief introductory call in the coming weeks?

Our pitch deck is attached for your review. I'm happy to provide any additional information that would be helpful.

Best regards,
${founder_name || user.full_name}
${founder_email || user.email}
${business_name}

---
This is an automated pitch email sent via Exit Blueprint. Please reply directly to continue the conversation.
    `.trim();

    // Send email using Base44 integration
    await base44.integrations.Core.SendEmail({
      from_name: founder_name || user.full_name,
      to: investor_email,
      subject: emailSubject,
      body: emailBody
    });

    // Log the outreach
    return Response.json({
      success: true,
      message: `Pitch email sent successfully to ${investor_name || investor_email}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});