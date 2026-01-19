import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Input validation
    const { 
      investor_email, 
      investor_name,
      business_name,
      tagline,
      pitch_deck_summary,
      founder_name,
      founder_email,
      custom_message
    } = body;

    // Validate required fields
    if (!investor_email || !business_name) {
      return Response.json({ 
        error: 'Missing required fields: investor_email and business_name' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(investor_email)) {
      return Response.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Sanitize inputs to prevent injection
    const sanitize = (str) => String(str || '').slice(0, 5000).trim();
    const sanitizedBusinessName = sanitize(business_name);
    const sanitizedMessage = sanitize(custom_message);

    // Create email content with sanitized data
    const emailSubject = `Investment Opportunity: ${sanitizedBusinessName}`;
    
    const emailBody = `
Dear ${sanitize(investor_name) || 'Investor'},

I hope this email finds you well. I'm reaching out to introduce ${sanitizedBusinessName}, ${sanitize(tagline) || 'an exciting new venture'}.

${sanitizedMessage || `We believe our company aligns well with your investment thesis and portfolio. We're building something truly transformative in the ${sanitize(pitch_deck_summary?.industry) || 'technology'} space.`}

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