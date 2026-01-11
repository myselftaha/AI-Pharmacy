import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify connection configuration
export async function verifyEmailConnection() {
    try {
        await transporter.verify();
        console.log('✅ Email server connection verified');
        return true;
    } catch (error) {
        console.error('❌ Email server connection failed:', error.message);
        return false;
    }
}

// Send low stock alert email
export async function sendLowStockEmail(medicines, settings) {
    // Check if notifications are enabled
    if (!settings?.lowStockAlerts || !settings?.emailNotifications) {
        console.log('Low stock email skipped - notifications disabled in settings');
        return { success: false, reason: 'disabled' };
    }

    const medicineList = medicines.map(m =>
        `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.stock} ${m.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${m.stock <= 5 ? '#dc2626' : '#f59e0b'};">
        ${m.stock <= 5 ? 'CRITICAL' : 'Low'}
      </td>
    </tr>`
    ).join('');

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Low Stock Alert</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The following medicines are running low in inventory:</p>
          
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Current Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${medicineList}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">
            <strong>Action Required:</strong> Please reorder these medicines to avoid stockouts.
          </p>
          
          <div class="footer">
            <p>This is an automated notification from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    try {
        await transporter.sendMail({
            from: `"${process.env.STORE_NAME || 'AI Pharmacy'}" <${process.env.STORE_EMAIL}>`,
            to: process.env.OWNER_EMAIL,
            subject: `⚠️ Low Stock Alert - ${medicines.length} Item(s) Need Attention`,
            html: emailHtml
        });

        console.log(`✅ Low stock email sent for ${medicines.length} medicines`);
        return { success: true, count: medicines.length };
    } catch (error) {
        console.error('❌ Failed to send low stock email:', error);
        return { success: false, error: error.message };
    }
}

// Send expiry alert email
export async function sendExpiryAlertEmail(expiringMedicines, settings) {
    if (!settings?.expiryAlerts || !settings?.emailNotifications) {
        console.log('Expiry alert email skipped - notifications disabled in settings');
        return { success: false, reason: 'disabled' };
    }

    const medicineList = expiringMedicines.map(m => {
        const daysUntilExpiry = Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.stock} ${m.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${new Date(m.expiryDate).toLocaleDateString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${daysUntilExpiry <= 7 ? '#dc2626' : '#f59e0b'};">
        ${daysUntilExpiry} days
      </td>
    </tr>`;
    }).join('');

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📅 Medicine Expiry Alert</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The following medicines are expiring soon:</p>
          
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Stock</th>
                <th>Expiry Date</th>
                <th>Time Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${medicineList}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">
            <strong>Action Required:</strong> Consider running promotions or discounts to move these items before expiry.
          </p>
          
          <div class="footer">
            <p>This is an automated notification from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    try {
        await transporter.sendMail({
            from: `"${process.env.STORE_NAME || 'AI Pharmacy'}" <${process.env.STORE_EMAIL}>`,
            to: process.env.OWNER_EMAIL,
            subject: `📅 Expiry Alert - ${expiringMedicines.length} Medicine(s) Expiring Soon`,
            html: emailHtml
        });

        console.log(`✅ Expiry alert email sent for ${expiringMedicines.length} medicines`);
        return { success: true, count: expiringMedicines.length };
    } catch (error) {
        console.error('❌ Failed to send expiry alert email:', error);
        return { success: false, error: error.message };
    }
}

// Send daily sales summary email
export async function sendDailySalesSummary(summary, settings) {
    if (!settings?.dailySalesSummary || !settings?.emailNotifications) {
        console.log('Daily sales summary email skipped - notifications disabled in settings');
        return { success: false, reason: 'disabled' };
    }

    const { date, totalSales, totalRevenue, totalTransactions, topMedicines, paymentBreakdown } = summary;

    const topMedicinesList = topMedicines?.slice(0, 5).map((m, i) =>
        `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">Rs ${m.revenue.toFixed(2)}</td>
    </tr>`
    ).join('') || '<tr><td colspan="4" style="padding: 8px; text-align: center;">No sales data</td></tr>';

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
        .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📊 Daily Sales Summary</h2>
          <p style="margin: 0;">${date || new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Here's your daily sales summary:</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${totalTransactions || 0}</div>
              <div class="stat-label">Transactions</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${totalSales || 0}</div>
              <div class="stat-label">Items Sold</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">Rs ${(totalRevenue || 0).toFixed(0)}</div>
              <div class="stat-label">Revenue</div>
            </div>
          </div>
          
          <h3 style="color: #059669; margin-top: 30px;">Top 5 Medicines</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topMedicinesList}
            </tbody>
          </table>
          
          ${paymentBreakdown ? `
          <h3 style="color: #059669; margin-top: 30px;">Payment Methods</h3>
          <p>Cash: Rs ${(paymentBreakdown.cash || 0).toFixed(2)} | Card: Rs ${(paymentBreakdown.card || 0).toFixed(2)}</p>
          ` : ''}
          
          <div class="footer">
            <p>This is your automated daily report from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    try {
        await transporter.sendMail({
            from: `"${process.env.STORE_NAME || 'AI Pharmacy'}" <${process.env.STORE_EMAIL}>`,
            to: process.env.OWNER_EMAIL,
            subject: `📊 Daily Sales Summary - ${date || new Date().toLocaleDateString()}`,
            html: emailHtml
        });

        console.log('✅ Daily sales summary email sent');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send daily sales summary email:', error);
        return { success: false, error: error.message };
    }
}

// Send test email
export async function sendTestEmail() {
    try {
        await transporter.sendMail({
            from: `"${process.env.STORE_NAME || 'AI Pharmacy'}" <${process.env.STORE_EMAIL}>`,
            to: process.env.OWNER_EMAIL,
            subject: '✅ Test Email - AI Pharmacy Notification System',
            html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #059669;">🎉 Email Configuration Successful!</h2>
          <p>If you're reading this, your Gmail SMTP configuration is working correctly.</p>
          <p><strong>Store Name:</strong> ${process.env.STORE_NAME || 'AI Pharmacy'}</p>
          <p><strong>From Email:</strong> ${process.env.STORE_EMAIL}</p>
          <p><strong>SMTP Server:</strong> ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Test email sent at: ${new Date().toLocaleString()}
          </p>
        </body>
        </html>
      `
        });

        console.log('✅ Test email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send test email:', error);
        return { success: false, error: error.message };
    }
}

export default {
    verifyEmailConnection,
    sendLowStockEmail,
    sendExpiryAlertEmail,
    sendDailySalesSummary,
    sendTestEmail
};
