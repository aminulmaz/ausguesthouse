import * as Brevo from '@getbrevo/brevo'; // <--- UPDATED to the correct package

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { to, template, data } = req.body;
    
    // 2. Configure Brevo
    let apiInstance = new Brevo.TransactionalEmailsApi(); // <--- This class name is correct
    let apiKey = apiInstance.authentications['apiKey'];
    
    // 3. Securely load your API key from Vercel Environment Variables
    // This 'process.env.BREVO_API_KEY' will be populated by Vercel on the server
    apiKey.apiKey = process.env.BREVO_API_KEY; 

    // 4. Select email template
    let templateId;
    if (template === 'booking_submitted') {
      templateId = 1; // <--- REPLACE with your Brevo template ID for submission
    } else if (template === 'booking_approved') {
      templateId = 2; // <--- REPLACE with your Brevo template ID for approval
    } else if (template === 'booking_rejected') {
      templateId = 3; // <--- REPLACE with your Brevo template ID for rejection
    } else {
      throw new Error('Invalid template specified');
    }

    // 5. Send the email
    await apiInstance.sendTransacEmail({
      to: [{ email: to, name: data.name }],
      templateId: templateId,
      params: data, // This passes { name, applicationId, checkIn } to your Brevo template
    });

    res.status(200).json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
}

